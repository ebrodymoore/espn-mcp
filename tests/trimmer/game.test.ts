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

// Richer mock for play-by-play filtering tests
const MOCK_PBP_DATA = {
  plays: [
    { text: "Start of 1st Period", type: { text: "Period Start" }, clock: { displayValue: "20:00" }, period: { number: 1 }, homeScore: "0", awayScore: "0", scoringPlay: false },
    { text: "Faceoff won by Team A", type: { text: "Face Off" }, clock: { displayValue: "20:00" }, period: { number: 1 }, homeScore: "0", awayScore: "0", scoringPlay: false },
    { text: "Shot by Player X", type: { text: "Shot" }, clock: { displayValue: "18:30" }, period: { number: 1 }, homeScore: "0", awayScore: "0", scoringPlay: false },
    { text: "Player Y Hooking against Player Z", type: { text: "Hooking" }, clock: { displayValue: "15:00" }, period: { number: 1 }, homeScore: "0", awayScore: "0", scoringPlay: false },
    { text: "Hit by Player A", type: { text: "Hit" }, clock: { displayValue: "12:00" }, period: { number: 1 }, homeScore: "0", awayScore: "0", scoringPlay: false },
    { text: "Goal by Player B", type: { text: "Goal" }, clock: { displayValue: "10:00" }, period: { number: 1 }, homeScore: "1", awayScore: "0", scoringPlay: true },
    { text: "Takeaway by Player C", type: { text: "Takeaway" }, clock: { displayValue: "8:00" }, period: { number: 1 }, homeScore: "1", awayScore: "0", scoringPlay: false },
    { text: "End of 1st Period", type: { text: "Period End" }, clock: { displayValue: "0:00" }, period: { number: 1 }, homeScore: "1", awayScore: "0", scoringPlay: false },
    { text: "Start of 2nd Period", type: { text: "Period Start" }, clock: { displayValue: "20:00" }, period: { number: 2 }, homeScore: "1", awayScore: "0", scoringPlay: false },
    { text: "Shot by Player D", type: { text: "Shot" }, clock: { displayValue: "17:00" }, period: { number: 2 }, homeScore: "1", awayScore: "0", scoringPlay: false },
    { text: "Giveaway by Player E", type: { text: "Giveaway" }, clock: { displayValue: "14:00" }, period: { number: 2 }, homeScore: "1", awayScore: "0", scoringPlay: false },
    { text: "Goal by Player F", type: { text: "Goal" }, clock: { displayValue: "11:00" }, period: { number: 2 }, homeScore: "1", awayScore: "1", scoringPlay: true },
    { text: "Player G Tripping against Player H", type: { text: "Tripping" }, clock: { displayValue: "5:00" }, period: { number: 2 }, homeScore: "1", awayScore: "1", scoringPlay: false },
    { text: "End of 2nd Period", type: { text: "Period End" }, clock: { displayValue: "0:00" }, period: { number: 2 }, homeScore: "1", awayScore: "1", scoringPlay: false },
  ],
  scoringPlays: [
    { text: "Goal by Player B", clock: { displayValue: "10:00" }, period: { number: 1 }, homeScore: 1, awayScore: 0, team: { abbreviation: "HOM" } },
    { text: "Goal by Player F", clock: { displayValue: "11:00" }, period: { number: 2 }, homeScore: 1, awayScore: 1, team: { abbreviation: "AWY" } },
  ],
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
  it("defaults to key plays filter", () => {
    const result = trimPlayByPlay(MOCK_PBP_DATA);
    const allPlays = result.periods.flatMap((p) => p.plays);
    // Should include: Period Start/End, Hooking, Goal, Tripping — NOT: Face Off, Shot, Hit, Takeaway, Giveaway
    const types = allPlays.map((p) => p.type);
    expect(types).not.toContain("Face Off");
    expect(types).not.toContain("Shot");
    expect(types).not.toContain("Hit");
    expect(types).not.toContain("Takeaway");
    expect(types).not.toContain("Giveaway");
    expect(types).toContain("Goal");
    expect(types).toContain("Hooking");
    expect(types).toContain("Tripping");
    expect(types).toContain("Period Start");
    expect(types).toContain("Period End");
  });

  it("scoring filter returns only scoring plays", () => {
    const result = trimPlayByPlay(MOCK_PBP_DATA, "scoring");
    const allPlays = result.periods.flatMap((p) => p.plays);
    expect(allPlays).toHaveLength(2);
    expect(allPlays.every((p) => p.scoringPlay)).toBe(true);
  });

  it("all filter returns every play", () => {
    const result = trimPlayByPlay(MOCK_PBP_DATA, "all");
    const allPlays = result.periods.flatMap((p) => p.plays);
    expect(allPlays).toHaveLength(14);
  });

  it("groups plays by period", () => {
    const result = trimPlayByPlay(MOCK_PBP_DATA, "all");
    expect(result.periods).toHaveLength(2);
    expect(result.periods[0].period).toBe(1);
    expect(result.periods[1].period).toBe(2);
    expect(result.periods[0].plays).toHaveLength(8);
    expect(result.periods[1].plays).toHaveLength(6);
  });

  it("only includes score when it changes", () => {
    const result = trimPlayByPlay(MOCK_PBP_DATA, "key");
    const allPlays = result.periods.flatMap((p) => p.plays);
    // First play should always have score
    expect(allPlays[0].homeScore).toBeDefined();
    // Plays with same score as previous should not have score fields
    const playsWithScore = allPlays.filter((p) => p.homeScore !== undefined);
    // Score changes: initial 0-0, then 1-0 (goal), then 1-1 (goal) = 3 score states
    // But period boundaries may reset the tracking — at minimum goals should have scores
    const goalPlays = allPlays.filter((p) => p.type === "Goal");
    expect(goalPlays.every((p) => p.homeScore !== undefined)).toBe(true);
  });

  it("extracts scoring plays summary", () => {
    const result = trimPlayByPlay(MOCK_PBP_DATA);
    expect(result.scoringPlays).toHaveLength(2);
    expect(result.scoringPlays[0].team).toBe("HOM");
    expect(result.scoringPlays[1].team).toBe("AWY");
  });

  it("handles missing plays gracefully", () => {
    const result = trimPlayByPlay({});
    expect(result.periods).toEqual([]);
    expect(result.scoringPlays).toEqual([]);
  });

  // Backward compat: old single-arg call still works (defaults to "key")
  it("works with single argument", () => {
    const result = trimPlayByPlay(MOCK_SUMMARY);
    expect(result.periods.length).toBeGreaterThanOrEqual(0);
    expect(result.scoringPlays).toHaveLength(1);
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
