import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EspnClient } from "../../src/espn/client.js";
import { Cache } from "../../src/cache.js";

describe("EspnClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let cache: Cache;
  let client: EspnClient;

  beforeEach(() => {
    cache = new Cache();
    fetchMock = vi.fn();
    client = new EspnClient(cache, { fetchFn: fetchMock, maxConcurrent: 2 });
  });

  it("fetches JSON from a URL", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ sports: [] }),
    });

    const result = await client.get("https://site.api.espn.com/test");
    expect(result).toEqual({ sports: [] });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sets a browser User-Agent header", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await client.get("https://site.api.espn.com/test");
    const callArgs = fetchMock.mock.calls[0];
    const headers = callArgs[1]?.headers;
    expect(headers["User-Agent"]).toMatch(/Mozilla/);
  });

  it("returns cached data on cache hit", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: "fresh" }),
    });

    await client.get("https://site.api.espn.com/test", 60_000);
    const result = await client.get("https://site.api.espn.com/test", 60_000);

    expect(result).toEqual({ data: "fresh" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("throws EspnApiError on 404", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(client.get("https://site.api.espn.com/test")).rejects.toThrow(
      "ESPN API returned 404"
    );
  });

  it("throws EspnApiError on 500", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(client.get("https://site.api.espn.com/test")).rejects.toThrow(
      "ESPN API is currently unavailable"
    );
  });

  it("throws EspnApiError on 429 with Retry-After info", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      headers: { get: (name: string) => (name === "Retry-After" ? "30" : null) },
    });

    await expect(client.get("https://site.api.espn.com/test")).rejects.toThrow(
      "rate limited"
    );
  });

  it("limits concurrent requests", async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    fetchMock.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 50));
      inFlight--;
      return { ok: true, status: 200, json: async () => ({}) };
    });

    const requests = Array.from({ length: 5 }, (_, i) =>
      client.get(`https://site.api.espn.com/test/${i}`)
    );

    await Promise.all(requests);
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it("deduplicates concurrent requests to the same URL", async () => {
    let callCount = 0;
    fetchMock.mockImplementation(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return { ok: true, status: 200, json: async () => ({ data: "result" }) };
    });

    const [r1, r2, r3] = await Promise.all([
      client.get("https://site.api.espn.com/same"),
      client.get("https://site.api.espn.com/same"),
      client.get("https://site.api.espn.com/same"),
    ]);

    expect(callCount).toBe(1);
    expect(r1).toEqual({ data: "result" });
    expect(r2).toEqual({ data: "result" });
    expect(r3).toEqual({ data: "result" });
  });

  it("does not dedup requests to different URLs", async () => {
    let callCount = 0;
    fetchMock.mockImplementation(async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return { ok: true, status: 200, json: async () => ({ n: callCount }) };
    });

    await Promise.all([
      client.get("https://site.api.espn.com/a"),
      client.get("https://site.api.espn.com/b"),
    ]);

    expect(callCount).toBe(2);
  });

  it("cleans up dedup map after request completes", async () => {
    fetchMock.mockResolvedValue({
      ok: true, status: 200, json: async () => ({ data: 1 }),
    });

    await client.get("https://site.api.espn.com/test");
    // Second call after first completes should make a new request
    await client.get("https://site.api.espn.com/test");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
