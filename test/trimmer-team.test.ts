import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { trimTeamOverview, trimRoster, trimSchedule } from "../src/trimmer/team.js";

describe("trimTeamOverview", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/team-overview-nhl.json"), "utf-8")
  );
  const result = trimTeamOverview(fixture);

  it("returns team identity fields", () => {
    expect(result.id).toBeTruthy();
    expect(result.name).toBeTruthy();
    expect(result.name).not.toBe("Unknown");
    expect(result.abbreviation).toBeTruthy();
  });

  it("returns record info", () => {
    // Record may be null during offseason, but should be a string during season
    expect(typeof result.record === "string" || result.record === null).toBe(true);
  });

  it("returns empty object for empty input", () => {
    const empty = trimTeamOverview({});
    expect(empty.name).toBe("Unknown");
  });
});

describe("trimRoster", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/team-roster-nhl.json"), "utf-8")
  );
  const result = trimRoster(fixture);

  it("returns a players array", () => {
    expect(result).toHaveProperty("players");
    expect(Array.isArray(result.players)).toBe(true);
    expect(result.players.length).toBeGreaterThan(0);
  });

  it("each player has expected fields", () => {
    for (const player of result.players) {
      expect(player.id).toBeTruthy();
      expect(player.name).toBeTruthy();
      expect(player.name).not.toBe("Unknown");
      expect(typeof player.position).toBe("string");
    }
  });

  it("returns empty array for empty input", () => {
    const empty = trimRoster({});
    expect(empty.players).toEqual([]);
  });
});

describe("trimSchedule", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/team-schedule-nhl.json"), "utf-8")
  );
  const result = trimSchedule(fixture);

  it("returns a games array", () => {
    expect(result).toHaveProperty("games");
    expect(Array.isArray(result.games)).toBe(true);
    expect(result.games.length).toBeGreaterThan(0);
  });

  it("each game has expected fields", () => {
    for (const game of result.games) {
      expect(game.gameId).toBeTruthy();
      expect(game.date).toBeTruthy();
      expect(typeof game.completed).toBe("boolean");
    }
  });

  it("returns empty array for empty input", () => {
    const empty = trimSchedule({});
    expect(empty.games).toEqual([]);
  });
});
