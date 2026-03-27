import { describe, it, expect } from "vitest";
import { trimStandings, trimRankings } from "../../src/trimmer/standings.js";

describe("trimStandings", () => {
  it("extracts standings entries", () => {
    const raw = { children: [{ name: "AFC West", standings: { entries: [{ team: { abbreviation: "KC", displayName: "Kansas City Chiefs" }, stats: [{ name: "wins", displayValue: "15" }, { name: "losses", displayValue: "2" }] }] } }] };
    const result = trimStandings(raw);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe("AFC West");
    expect(result.groups[0].teams[0].stats.wins).toBe("15");
  });
});

describe("trimRankings", () => {
  it("extracts ranking entries", () => {
    const raw = { rankings: [{ name: "AP Top 25", ranks: [{ current: 1, team: { abbreviation: "UGA", displayName: "Georgia Bulldogs" }, recordSummary: "13-0", points: 1550 }] }] };
    const result = trimRankings(raw);
    expect(result.polls).toHaveLength(1);
    expect(result.polls[0].ranks[0].rank).toBe(1);
    expect(result.polls[0].ranks[0].team).toBe("Georgia Bulldogs");
  });
});
