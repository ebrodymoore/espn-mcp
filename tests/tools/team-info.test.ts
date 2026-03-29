import { describe, it, expect, vi } from "vitest";
import { teamInfoSchema, getTeamInfo } from "../../src/tools/team-info.js";
import { Resolver } from "../../src/registry/resolver.js";
import { EspnClient } from "../../src/espn/client.js";
import { Cache } from "../../src/cache.js";

const TEST_REGISTRY = {
  nhl: {
    sport: "hockey", league: "nhl", name: "NHL", aliases: [],
    teams: { det: { id: "17", name: "Detroit Red Wings", abbreviation: "DET", aliases: ["red wings"] } },
  },
};

describe("teamInfoSchema", () => {
  it("validates correct params", () => {
    const result = teamInfoSchema.safeParse({ league: "nfl", team: "chiefs", aspect: "roster" });
    expect(result.success).toBe(true);
  });
  it("rejects missing required params", () => {
    const result = teamInfoSchema.safeParse({ league: "nfl" });
    expect(result.success).toBe(false);
  });
});

describe("getTeamInfo", () => {
  it("returns structured error on 404", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false, status: 404, statusText: "Not Found",
    });
    const client = new EspnClient(new Cache(), { fetchFn: fetchMock });
    const resolver = new Resolver(TEST_REGISTRY);
    const result = await getTeamInfo(
      { league: "nhl", team: "nonexistent", aspect: "overview" },
      resolver, client
    ) as Record<string, unknown>;
    expect(result.error).toBe("team_not_found");
  });
});
