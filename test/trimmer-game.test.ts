import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  trimBoxscore,
  trimPlayByPlay,
  trimOdds,
  trimWinProbability,
  trimGameSummary,
} from "../src/trimmer/game.js";

const nhlFixture = JSON.parse(
  readFileSync(join(__dirname, "fixtures/game-summary-nhl.json"), "utf-8")
);

const nbaFixture = JSON.parse(
  readFileSync(join(__dirname, "fixtures/game-summary-nba.json"), "utf-8")
);

const nflFixture = JSON.parse(
  readFileSync(join(__dirname, "fixtures/game-summary-nfl.json"), "utf-8")
);

describe("trimBoxscore (NFL - completed game)", () => {
  const nflBoxResult = trimBoxscore(nflFixture);

  it("returns 2 teams for completed game", () => {
    expect(nflBoxResult.teams.length).toBe(2);
  });

  it("teams have players with stats", () => {
    for (const team of nflBoxResult.teams) {
      expect(team.name).not.toBe("???");
      expect(team.players.length).toBeGreaterThan(0);
      for (const player of team.players) {
        expect(player.name).not.toBe("Unknown");
        expect(Object.keys(player.stats).length).toBeGreaterThan(0);
      }
    }
  });
});

describe("trimBoxscore (NHL fixture)", () => {
  const result = trimBoxscore(nhlFixture);

  it("returns teams array", () => {
    expect(result).toHaveProperty("teams");
    expect(Array.isArray(result.teams)).toBe(true);
    // NHL fixture may be a future game with no boxscore player data
  });

  it("each team has name and players when present", () => {
    for (const team of result.teams) {
      expect(team.name).toBeTruthy();
      expect(team.name).not.toBe("???");
      expect(Array.isArray(team.players)).toBe(true);
    }
  });

  it("players have name, group, and stats when present", () => {
    for (const team of result.teams) {
      for (const player of team.players) {
        expect(player.name).toBeTruthy();
        expect(player.name).not.toBe("Unknown");
        expect(player.group).toBeTruthy();
        expect(Object.keys(player.stats).length).toBeGreaterThan(0);
      }
    }
  });

  it("returns line scores", () => {
    expect(result).toHaveProperty("lineScores");
    expect(Array.isArray(result.lineScores.home)).toBe(true);
    expect(Array.isArray(result.lineScores.away)).toBe(true);
  });

  it("returns empty for empty input", () => {
    const empty = trimBoxscore({});
    expect(empty.teams).toEqual([]);
  });
});

describe("trimGameSummary", () => {
  const result = trimGameSummary(nhlFixture);

  it("returns game status", () => {
    expect(typeof result.status).toBe("string");
    expect(result.status).not.toBe("UNKNOWN");
    expect(typeof result.completed).toBe("boolean");
  });

  it("returns home and away teams with real data", () => {
    expect(result.home.name).toBeTruthy();
    expect(result.home.name).not.toBe("Unknown");
    expect(result.home.abbreviation).not.toBe("???");

    expect(result.away.name).toBeTruthy();
    expect(result.away.name).not.toBe("Unknown");
    expect(result.away.abbreviation).not.toBe("???");
  });

  it("returns line scores", () => {
    expect(Array.isArray(result.lineScores.home)).toBe(true);
    expect(Array.isArray(result.lineScores.away)).toBe(true);
  });
});

describe("trimOdds", () => {
  const result = trimOdds(nhlFixture);

  it("returns lines array", () => {
    expect(result).toHaveProperty("lines");
    expect(Array.isArray(result.lines)).toBe(true);
  });

  it("lines have spread and provider when present", () => {
    if (result.lines.length > 0) {
      for (const line of result.lines) {
        expect(typeof line.spread).toBe("string");
        expect(typeof line.overUnder).toBe("number");
        expect(typeof line.provider).toBe("string");
      }
    }
  });

  it("returns empty lines for empty input", () => {
    const empty = trimOdds({});
    expect(empty.lines).toEqual([]);
  });
});

describe("trimPlayByPlay", () => {
  it("returns plays and scoringPlays arrays", () => {
    const result = trimPlayByPlay(nhlFixture);
    expect(result).toHaveProperty("plays");
    expect(result).toHaveProperty("scoringPlays");
    expect(Array.isArray(result.plays)).toBe(true);
    expect(Array.isArray(result.scoringPlays)).toBe(true);
  });

  it("returns empty arrays for empty input", () => {
    const empty = trimPlayByPlay({});
    expect(empty.plays).toEqual([]);
    expect(empty.scoringPlays).toEqual([]);
  });
});

describe("trimWinProbability", () => {
  it("returns dataPoints array", () => {
    // NBA fixture has winprobability
    const result = trimWinProbability(nbaFixture);
    expect(result).toHaveProperty("dataPoints");
    expect(Array.isArray(result.dataPoints)).toBe(true);
  });

  it("data points have homeWinPct when present", () => {
    const result = trimWinProbability(nbaFixture);
    if (result.dataPoints.length > 0) {
      for (const point of result.dataPoints.slice(0, 5)) {
        expect(typeof point.homeWinPct).toBe("number");
      }
    }
  });

  it("returns empty for empty input", () => {
    const empty = trimWinProbability({});
    expect(empty.dataPoints).toEqual([]);
  });
});
