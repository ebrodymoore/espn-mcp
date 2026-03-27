import { describe, it, expect } from "vitest";
import { trimPlayerOverview, trimPlayerStats, trimPlayerGamelog } from "../../src/trimmer/player.js";

describe("trimPlayerOverview", () => {
  it("extracts player basics", () => {
    const raw = { athlete: { id: "4432577", displayName: "Patrick Mahomes", position: { abbreviation: "QB" }, age: 30, displayHeight: "6' 2\"", displayWeight: "225 lbs", team: { displayName: "Kansas City Chiefs", abbreviation: "KC" } } };
    const result = trimPlayerOverview(raw);
    expect(result.name).toBe("Patrick Mahomes");
    expect(result.position).toBe("QB");
    expect(result.team).toBe("Kansas City Chiefs");
  });
});

describe("trimPlayerStats", () => {
  it("extracts season stats", () => {
    const raw = { statistics: [{ displayName: "2025", labels: ["GP", "CMP", "YDS", "TD"], stats: ["17", "410", "4800", "38"] }] };
    const result = trimPlayerStats(raw);
    expect(result.seasons).toHaveLength(1);
    expect(result.seasons[0].stats.TD).toBe("38");
  });
  it("handles missing statistics", () => {
    expect(trimPlayerStats({}).seasons).toEqual([]);
  });
});

describe("trimPlayerGamelog", () => {
  it("extracts game entries", () => {
    const raw = { seasonTypes: [{ categories: [{ events: [{ id: "401772988", atVs: "vs", opponent: { abbreviation: "BUF" }, gameResult: "W 27-24", stats: ["22/30", "280", "3", "0"] }], labels: ["C/ATT", "YDS", "TD", "INT"] }] }] };
    const result = trimPlayerGamelog(raw);
    expect(result.games).toHaveLength(1);
    expect(result.games[0].opponent).toBe("BUF");
    expect(result.games[0].stats.YDS).toBe("280");
  });
});
