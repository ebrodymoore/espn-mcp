import { Cache } from "../cache.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export class EspnApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "EspnApiError";
  }
}

interface EspnClientOptions {
  fetchFn?: typeof fetch;
  maxConcurrent?: number;
}

export class EspnClient {
  private cache: Cache;
  private fetchFn: typeof fetch;
  private maxConcurrent: number;
  private inFlight = 0;
  private queue: Array<() => void> = [];
  private pending = new Map<string, Promise<unknown>>();

  constructor(cache: Cache, options: EspnClientOptions = {}) {
    this.cache = cache;
    this.fetchFn = options.fetchFn ?? fetch;
    this.maxConcurrent = options.maxConcurrent ?? 2;
  }

  async get<T = unknown>(url: string, ttlMs?: number): Promise<T> {
    if (ttlMs) {
      const cached = this.cache.get<T>(url);
      if (cached !== undefined) return cached;
    }

    // Deduplicate concurrent requests to the same URL
    const existing = this.pending.get(url);
    if (existing) return existing as Promise<T>;

    const promise = this.fetchAndCache<T>(url, ttlMs);
    this.pending.set(url, promise);

    try {
      return await promise;
    } finally {
      this.pending.delete(url);
    }
  }

  private async fetchAndCache<T>(url: string, ttlMs?: number): Promise<T> {
    await this.acquireSlot();
    try {
      const response = await this.fetchFn(url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!response.ok) {
        this.handleHttpError(response);
      }

      const data = (await response.json()) as T;

      if (ttlMs) {
        this.cache.set(url, data, ttlMs);
      }

      return data;
    } finally {
      this.releaseSlot();
    }
  }

  private handleHttpError(response: {
    status: number;
    statusText: string;
    headers?: { get: (name: string) => string | null };
  }): never {
    if (response.status === 429) {
      const retryAfter = response.headers?.get?.("Retry-After");
      const msg = retryAfter
        ? `ESPN API rate limited. Retry after ${retryAfter} seconds.`
        : "ESPN API rate limited. Try again shortly.";
      throw new EspnApiError(429, msg);
    }

    if (response.status >= 500) {
      throw new EspnApiError(
        response.status,
        "ESPN API is currently unavailable. Try again shortly."
      );
    }

    throw new EspnApiError(
      response.status,
      `ESPN API returned ${response.status}: ${response.statusText}`
    );
  }

  private acquireSlot(): Promise<void> {
    if (this.inFlight < this.maxConcurrent) {
      this.inFlight++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.inFlight++;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.inFlight--;
    const next = this.queue.shift();
    if (next) next();
  }
}
