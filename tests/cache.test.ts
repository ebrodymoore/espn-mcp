import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Cache } from "../src/cache.js";

describe("Cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined for missing keys", () => {
    const cache = new Cache();
    expect(cache.get("missing")).toBeUndefined();
  });

  it("stores and retrieves values", () => {
    const cache = new Cache();
    cache.set("key", { data: "hello" }, 60_000);
    expect(cache.get("key")).toEqual({ data: "hello" });
  });

  it("returns undefined for expired entries", () => {
    const cache = new Cache();
    cache.set("key", { data: "hello" }, 1_000);
    vi.advanceTimersByTime(1_001);
    expect(cache.get("key")).toBeUndefined();
  });

  it("returns value just before expiry", () => {
    const cache = new Cache();
    cache.set("key", { data: "hello" }, 1_000);
    vi.advanceTimersByTime(999);
    expect(cache.get("key")).toEqual({ data: "hello" });
  });

  it("overwrites existing entries", () => {
    const cache = new Cache();
    cache.set("key", "first", 60_000);
    cache.set("key", "second", 60_000);
    expect(cache.get("key")).toBe("second");
  });

  it("handles multiple independent keys", () => {
    const cache = new Cache();
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBe(2);
  });

  it("cleans up expired entries on get", () => {
    const cache = new Cache();
    cache.set("key", "value", 1_000);
    vi.advanceTimersByTime(1_001);
    cache.get("key");
    expect(cache.size).toBe(0);
  });

  it("evicts oldest entry when exceeding max size", () => {
    const cache = new Cache(3);
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    cache.set("c", 3, 60_000);
    cache.set("d", 4, 60_000); // should evict "a"
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("d")).toBe(4);
    expect(cache.size).toBe(3);
  });

  it("refreshes entry position on get", () => {
    const cache = new Cache(3);
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    cache.set("c", 3, 60_000);
    cache.get("a"); // refresh "a"
    cache.set("d", 4, 60_000); // should evict "b", not "a"
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
  });

  it("refreshes entry position on set (overwrite)", () => {
    const cache = new Cache(3);
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    cache.set("c", 3, 60_000);
    cache.set("a", 10, 60_000); // overwrite refreshes "a"
    cache.set("d", 4, 60_000); // should evict "b"
    expect(cache.get("a")).toBe(10);
    expect(cache.get("b")).toBeUndefined();
  });

  it("defaults to 500 max entries", () => {
    const cache = new Cache();
    for (let i = 0; i < 501; i++) {
      cache.set(`key-${i}`, i, 60_000);
    }
    expect(cache.size).toBe(500);
    expect(cache.get("key-0")).toBeUndefined();
    expect(cache.get("key-500")).toBe(500);
  });
});
