import { describe, it, expect, vi } from "vitest";
import { lookup } from "../../src/tools/lookup.js";
import { Resolver } from "../../src/registry/resolver.js";
import { EspnClient } from "../../src/espn/client.js";
import { Cache } from "../../src/cache.js";

const TEST_REGISTRY = {
  nfl: {
    sport: "football", league: "nfl", name: "National Football League", aliases: [],
    teams: { sf: { id: "25", name: "San Francisco 49ers", abbreviation: "SF", aliases: ["niners"] } },
  },
};

describe("lookup", () => {
  const resolver = new Resolver(TEST_REGISTRY);
  const fetchMock = vi.fn();
  const client = new EspnClient(new Cache(), { fetchFn: fetchMock });

  it("resolves team from registry without API call", async () => {
    const result = await lookup({ query: "niners" }, resolver, client);
    expect(result).toEqual({ type: "team", id: "25", name: "San Francisco 49ers", abbreviation: "SF", sport: "football", league: "nfl" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves league from registry without API call", async () => {
    const result = await lookup({ query: "nfl" }, resolver, client);
    expect(result).toEqual({ type: "league", sport: "football", league: "nfl" });
  });

  it("falls back to ESPN search for unknown queries", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ results: [{ type: "athlete", items: [{ id: "1234", displayName: "LeBron James", league: { abbreviation: "NBA" }, sport: { slug: "basketball" } }] }] }),
    });
    const result = (await lookup({ query: "LeBron" }, resolver, client)) as Record<string, unknown>;
    expect(result.matches).toBeDefined();
  });

  it("returns error when nothing found", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ results: [] }) });
    const result = (await lookup({ query: "xyznothing" }, resolver, client)) as Record<string, unknown>;
    expect(result.error).toContain("Could not find");
  });
});
