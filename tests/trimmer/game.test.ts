import { describe, it, expect } from "vitest";
import { trimBoxscore, trimPlayByPlay, trimOdds, trimWinProbability, trimGameSummary } from "../../src/trimmer/game.js";

const MOCK_SUMMARY = {
  header: {
    competitions: [
      {
        status: { type: { name: "STATUS_FINAL", completed: true } },
        competitors: [
          {
            homeAway: "home",
            team: { abbreviation: "NE", displayName: "New England Patriots" },
            score: "13",
            linescores: [{ displayValue: "0" }, { displayValue: "0" }, { displayValue: "0" }, { displayValue: "13" }],
          },
          {
            homeAway: "away",
            team: { abbreviation: "SEA", displayName: "Seattle Seahawks" },
            score: "34",
            linescores: [{ displayValue: "7" }, { displayValue: "14" }, { displayValue: "6" }, { displayValue: "7" }],
          },
        ],
      },
    ],
  },
  boxscore: {
    players: [
      {
        team: { abbreviation: "NE" },
        statistics: [
          {
            name: "passing",
            labels: ["C/ATT", "YDS", "TD", "INT"],
            athletes: [
              {
                athlete: { displayName: "Drake Maye" },
                stats: ["18/30", "210", "1", "2"],
              },
            ],
            totals: ["18/30", "210", "1", "2"],
          },
        ],
      },
    ],
    teams: [
      {
        team: { abbreviation: "NE" },
        statistics: [
          { name: "firstDowns", displayValue: "15" },
          { name: "totalYards", displayValue: "280" },
        ],
      },
    ],
  },
  plays: [
    {
      text: "G.Smith pass to DK Metcalf for 25 yards",
      type: { text: "Pass" },
      clock: { displayValue: "12:30" },
      period: { number: 1 },
      homeScore: "0",
      awayScore: "0",
      scoringPlay: false,
    },
  ],
  scoringPlays: [
    {
      text: "G.Smith 1 yard rush (J.Myers kick)",
      clock: { displayValue: "8:15" },
      period: { number: 1 },
      homeScore: 0,
      awayScore: 7,
      team: { abbreviation: "SEA" },
    },
  ],
  odds: [
    { details: "SEA -7.5", overUnder: 36.5, provider: { name: "ESPN BET" } },
  ],
  winprobability: [
    { homeWinPercentage: 0.5, playId: "1", tiePercentage: 0 },
    { homeWinPercentage: 0.35, playId: "2", tiePercentage: 0 },
  ],
  news: { articles: [{ headline: "ignore" }] },
  videos: [{ id: "ignore" }],
};

describe("trimBoxscore", () => {
  it("extracts player stat lines", () => {
    const result = trimBoxscore(MOCK_SUMMARY);
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].name).toBe("NE");
    expect(result.teams[0].players).toHaveLength(1);
    expect(result.teams[0].players[0]).toEqual({
      name: "Drake Maye",
      group: "passing",
      stats: { "C/ATT": "18/30", YDS: "210", TD: "1", INT: "2" },
    });
  });

  it("extracts team stats", () => {
    const result = trimBoxscore(MOCK_SUMMARY);
    expect(result.teams[0].teamStats).toEqual({
      firstDowns: "15",
      totalYards: "280",
    });
  });

  it("extracts line scores", () => {
    const result = trimBoxscore(MOCK_SUMMARY);
    expect(result.lineScores.home).toEqual(["0", "0", "0", "13"]);
    expect(result.lineScores.away).toEqual(["7", "14", "6", "7"]);
  });

  it("strips videos and news", () => {
    const stringified = JSON.stringify(trimBoxscore(MOCK_SUMMARY));
    expect(stringified).not.toContain("ignore");
  });

  it("handles missing boxscore gracefully", () => {
    const result = trimBoxscore({ header: MOCK_SUMMARY.header });
    expect(result.teams).toEqual([]);
  });
});

describe("trimPlayByPlay", () => {
  it("extracts plays array", () => {
    const result = trimPlayByPlay(MOCK_SUMMARY);
    expect(result.plays.length).toBeGreaterThan(0);
    expect(result.plays[0]).toEqual({
      text: "G.Smith pass to DK Metcalf for 25 yards",
      type: "Pass",
      clock: "12:30",
      period: 1,
      homeScore: "0",
      awayScore: "0",
      scoringPlay: false,
    });
  });

  it("extracts scoring plays", () => {
    const result = trimPlayByPlay(MOCK_SUMMARY);
    expect(result.scoringPlays).toHaveLength(1);
    expect(result.scoringPlays[0].team).toBe("SEA");
  });

  it("handles missing plays gracefully", () => {
    const result = trimPlayByPlay({});
    expect(result.plays).toEqual([]);
    expect(result.scoringPlays).toEqual([]);
  });
});

describe("trimOdds", () => {
  it("extracts odds data", () => {
    const result = trimOdds(MOCK_SUMMARY);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toEqual({
      spread: "SEA -7.5",
      overUnder: 36.5,
      provider: "ESPN BET",
    });
  });

  it("handles missing odds gracefully", () => {
    const result = trimOdds({});
    expect(result.lines).toEqual([]);
  });
});

describe("trimWinProbability", () => {
  it("extracts win probability data", () => {
    const result = trimWinProbability(MOCK_SUMMARY);
    expect(result.dataPoints).toHaveLength(2);
    expect(result.dataPoints[0].homeWinPct).toBe(0.5);
  });

  it("handles missing win probability gracefully", () => {
    const result = trimWinProbability({});
    expect(result.dataPoints).toEqual([]);
  });
});

describe("trimGameSummary", () => {
  it("returns combined summary with status", () => {
    const result = trimGameSummary(MOCK_SUMMARY);
    expect(result.status).toBe("STATUS_FINAL");
    expect(result.home.name).toBe("New England Patriots");
    expect(result.home.score).toBe("13");
    expect(result.away.name).toBe("Seattle Seahawks");
    expect(result.away.score).toBe("34");
    expect(result.lineScores).toBeDefined();
    expect(result.scoringPlays).toHaveLength(1);
  });
});
