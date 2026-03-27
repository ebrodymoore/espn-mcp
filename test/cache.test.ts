import { describe, it, expect, vi } from "vitest";
import { Cache } from "../src/cache.js";

describe("Cache", () => {
  it("returns undefined for missing keys", () => {
    const cache = new Cache();
    expect(cache.get("nope")).toBeUndefined();
  });

  it("stores and retrieves a value within TTL", () => {
    const cache = new Cache();
    cache.set("key", { data: 1 }, 60_000);
    expect(cache.get("key")).toEqual({ data: 1 });
  });

  it("returns undefined after TTL expires", () => {
    const cache = new Cache();
    vi.useFakeTimers();
    cache.set("key", "value", 1000);
    vi.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeUndefined();
    vi.useRealTimers();
  });

  it("tracks size", () => {
    const cache = new Cache();
    expect(cache.size).toBe(0);
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    expect(cache.size).toBe(2);
  });
});
