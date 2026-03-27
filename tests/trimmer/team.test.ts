import { describe, it, expect } from "vitest";
import { trimRoster, trimSchedule, trimTeamOverview } from "../../src/trimmer/team.js";

describe("trimRoster", () => {
  it("extracts player essentials", () => {
    const raw = {
      athletes: [{ items: [{ id: "4432577", displayName: "Patrick Mahomes", jersey: "15", position: { abbreviation: "QB" }, age: 30, status: { type: { name: "Active" } }, headshot: { href: "https://cdn.espn.com/photo.png" } }] }],
    };
    const result = trimRoster(raw);
    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toEqual({ id: "4432577", name: "Patrick Mahomes", jersey: "15", position: "QB", age: 30, status: "Active" });
  });
  it("handles missing athletes gracefully", () => {
    expect(trimRoster({}).players).toEqual([]);
  });
});

describe("trimSchedule", () => {
  it("extracts game schedule items", () => {
    const raw = {
      events: [{ id: "401772988", name: "SEA @ NE", date: "2026-02-08T18:30Z",
        competitions: [{ competitors: [
          { homeAway: "home", team: { abbreviation: "NE" }, score: { displayValue: "13" }, winner: false },
          { homeAway: "away", team: { abbreviation: "SEA" }, score: { displayValue: "34" }, winner: true },
        ], status: { type: { completed: true } } }],
      }],
    };
    const result = trimSchedule(raw);
    expect(result.games).toHaveLength(1);
    expect(result.games[0].gameId).toBe("401772988");
    expect(result.games[0].date).toBe("2026-02-08T18:30Z");
  });
});

describe("trimTeamOverview", () => {
  it("extracts team basics", () => {
    const raw = { team: { id: "12", displayName: "Kansas City Chiefs", abbreviation: "KC", record: { items: [{ summary: "15-2" }] }, standingSummary: "1st in AFC West" } };
    const result = trimTeamOverview(raw);
    expect(result.name).toBe("Kansas City Chiefs");
    expect(result.record).toBe("15-2");
  });
});
