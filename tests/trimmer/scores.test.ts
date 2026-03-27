import { describe, it, expect } from "vitest";
import { trimScoreboard } from "../../src/trimmer/scores.js";

const MOCK_SCOREBOARD = {
  events: [
    {
      id: "401772988",
      name: "Seattle Seahawks at New England Patriots",
      shortName: "SEA @ NE",
      competitions: [
        {
          id: "401772988",
          status: {
            type: { name: "STATUS_FINAL", completed: true },
            displayClock: "0:00",
            period: 4,
          },
          competitors: [
            {
              id: "17",
              homeAway: "home",
              team: {
                id: "17",
                abbreviation: "NE",
                displayName: "New England Patriots",
                logo: "https://a.espncdn.com/logo.png",
                links: [{ href: "https://espn.com" }],
              },
              score: "13",
              records: [{ summary: "4-13" }],
            },
            {
              id: "26",
              homeAway: "away",
              team: {
                id: "26",
                abbreviation: "SEA",
                displayName: "Seattle Seahawks",
                logo: "https://a.espncdn.com/logo2.png",
                links: [{ href: "https://espn.com" }],
              },
              score: "34",
              records: [{ summary: "10-7" }],
            },
          ],
          odds: [
            {
              details: "SEA -7.5",
              overUnder: 36.5,
              provider: { name: "ESPN BET" },
            },
          ],
          broadcasts: [{ names: ["FOX"] }],
          venue: {
            fullName: "Gillette Stadium",
            address: { city: "Foxborough", state: "MA" },
            indoor: false,
          },
        },
      ],
    },
  ],
};

describe("trimScoreboard", () => {
  it("extracts game essentials", () => {
    const result = trimScoreboard(MOCK_SCOREBOARD);
    expect(result.games).toHaveLength(1);
    const game = result.games[0];
    expect(game.gameId).toBe("401772988");
    expect(game.name).toBe("SEA @ NE");
    expect(game.status).toBe("STATUS_FINAL");
    expect(game.clock).toBe("0:00");
    expect(game.period).toBe(4);
  });

  it("extracts team names and scores", () => {
    const result = trimScoreboard(MOCK_SCOREBOARD);
    const game = result.games[0];
    expect(game.home).toEqual({ abbreviation: "NE", name: "New England Patriots", score: "13" });
    expect(game.away).toEqual({ abbreviation: "SEA", name: "Seattle Seahawks", score: "34" });
  });

  it("includes odds when present", () => {
    const result = trimScoreboard(MOCK_SCOREBOARD);
    expect(result.games[0].odds).toEqual({ spread: "SEA -7.5", overUnder: 36.5 });
  });

  it("includes broadcast info", () => {
    const result = trimScoreboard(MOCK_SCOREBOARD);
    expect(result.games[0].broadcast).toBe("FOX");
  });

  it("strips logos, links, venue details, records", () => {
    const result = trimScoreboard(MOCK_SCOREBOARD);
    const stringified = JSON.stringify(result);
    expect(stringified).not.toContain("espncdn.com");
    expect(stringified).not.toContain("Gillette");
    expect(stringified).not.toContain("4-13");
  });

  it("handles missing odds gracefully", () => {
    const noOdds = structuredClone(MOCK_SCOREBOARD);
    delete (noOdds.events[0].competitions[0] as Record<string, unknown>).odds;
    const result = trimScoreboard(noOdds);
    expect(result.games[0].odds).toBeNull();
  });

  it("handles empty events array", () => {
    const result = trimScoreboard({ events: [] });
    expect(result.games).toEqual([]);
  });

  it("handles missing events entirely", () => {
    const result = trimScoreboard({});
    expect(result.games).toEqual([]);
  });
});
