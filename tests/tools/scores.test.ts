import { describe, it, expect, vi } from "vitest";
import { getScores } from "../../src/tools/scores.js";
import { Resolver } from "../../src/registry/resolver.js";
import { EspnClient } from "../../src/espn/client.js";
import { Cache } from "../../src/cache.js";

const TEST_REGISTRY = {
  nfl: {
    sport: "football", league: "nfl", name: "NFL", aliases: [],
    teams: { kc: { id: "12", name: "Kansas City Chiefs", abbreviation: "KC", aliases: ["chiefs"] } },
  },
  nba: { sport: "basketball", league: "nba", name: "NBA", aliases: [], teams: {} },
  mlb: { sport: "baseball", league: "mlb", name: "MLB", aliases: [], teams: {} },
  nhl: { sport: "hockey", league: "nhl", name: "NHL", aliases: [], teams: {} },
};

describe("getScores", () => {
  const resolver = new Resolver(TEST_REGISTRY);

  it("fetches scores for a specific league", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ events: [{ id: "123", shortName: "KC @ BUF", competitions: [{ status: { type: { name: "STATUS_FINAL", completed: true }, displayClock: "0:00", period: 4 }, competitors: [{ homeAway: "home", team: { abbreviation: "BUF", displayName: "Buffalo Bills" }, score: "21" }, { homeAway: "away", team: { abbreviation: "KC", displayName: "Kansas City Chiefs" }, score: "27" }] }] }] }),
    });
    const client = new EspnClient(new Cache(), { fetchFn: fetchMock });
    const result = (await getScores({ league: "nfl" }, resolver, client)) as Record<string, unknown>;
    expect((result.games as unknown[]).length).toBe(1);
  });

  it("returns error when sport but no league specified", async () => {
    const client = new EspnClient(new Cache(), { fetchFn: vi.fn() });
    const result = (await getScores({ sport: "football" }, resolver, client)) as Record<string, unknown>;
    expect(result.error).toContain("specify a league");
  });
});
