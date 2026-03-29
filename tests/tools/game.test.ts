import { describe, it, expect, vi } from "vitest";
import { gameSchema, getGame } from "../../src/tools/game.js";
import { Resolver } from "../../src/registry/resolver.js";
import { EspnClient } from "../../src/espn/client.js";
import { Cache } from "../../src/cache.js";

const TEST_REGISTRY = {
  nfl: { sport: "football", league: "nfl", name: "NFL", aliases: [], teams: {} },
};

describe("gameSchema", () => {
  it("validates correct params", () => {
    const result = gameSchema.safeParse({ gameId: "401772988", detail: "boxscore" });
    expect(result.success).toBe(true);
  });

  it("accepts playTypes param", () => {
    const result = gameSchema.safeParse({ gameId: "401772988", detail: "playbyplay", playTypes: "key" });
    expect(result.success).toBe(true);
  });

  it("accepts all playTypes values", () => {
    for (const val of ["key", "scoring", "all"]) {
      const result = gameSchema.safeParse({ gameId: "123", detail: "playbyplay", playTypes: val });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid playTypes", () => {
    const result = gameSchema.safeParse({ gameId: "123", detail: "playbyplay", playTypes: "invalid" });
    expect(result.success).toBe(false);
  });

  it("playTypes is optional", () => {
    const result = gameSchema.safeParse({ gameId: "123", detail: "playbyplay" });
    expect(result.success).toBe(true);
  });
});

describe("getGame", () => {
  it("returns structured error on 404", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false, status: 404, statusText: "Not Found",
    });
    const client = new EspnClient(new Cache(), { fetchFn: fetchMock });
    const resolver = new Resolver(TEST_REGISTRY);
    const result = await getGame(
      { gameId: "000000", league: "nfl", detail: "summary" },
      resolver, client
    ) as Record<string, unknown>;
    expect(result.error).toBe("game_not_found");
  });
});
