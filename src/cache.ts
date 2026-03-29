interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }
    // Move to end (most recently used) — Map iteration order is insertion order
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    // Delete first so re-insertion moves to end
    this.store.delete(key);
    this.store.set(key, { data, expiry: Date.now() + ttlMs });
    // Evict oldest if over max size
    if (this.store.size > this.maxSize) {
      const oldest = this.store.keys().next().value!;
      this.store.delete(oldest);
    }
  }

  get size(): number {
    return this.store.size;
  }
}
