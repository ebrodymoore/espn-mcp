import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { trimScoreboard } from "../src/trimmer/scores.js";

const fixture = JSON.parse(
  readFileSync(join(__dirname, "fixtures/scoreboard-nhl.json"), "utf-8")
);

describe("trimScoreboard", () => {
  const result = trimScoreboard(fixture);

  it("returns a games array", () => {
    expect(result).toHaveProperty("games");
    expect(Array.isArray(result.games)).toBe(true);
  });

  it("each game has expected fields", () => {
    for (const game of result.games) {
      expect(game.gameId).toBeTruthy();
      expect(game.name).toBeTruthy();
      expect(typeof game.status).toBe("string");
      expect(typeof game.completed).toBe("boolean");

      expect(game.home).toBeDefined();
      expect(game.home.abbreviation).toBeTruthy();
      expect(game.home.name).toBeTruthy();

      expect(game.away).toBeDefined();
      expect(game.away.abbreviation).toBeTruthy();
      expect(game.away.name).toBeTruthy();
    }
  });

  it("does not return empty abbreviations", () => {
    for (const game of result.games) {
      expect(game.home.abbreviation).not.toBe("???");
      expect(game.away.abbreviation).not.toBe("???");
    }
  });

  it("returns empty array for empty input", () => {
    const empty = trimScoreboard({});
    expect(empty.games).toEqual([]);
  });
});
