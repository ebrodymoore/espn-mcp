import { describe, it, expect } from "vitest";
import { trimPlayerOverview, trimPlayerStats, trimPlayerGamelog } from "../../src/trimmer/player.js";

describe("trimPlayerOverview", () => {
  it("extracts statistics splits", () => {
    const raw = {
      statistics: {
        labels: ["GP", "G", "A", "PTS"],
        splits: [
          { displayName: "Regular Season", stats: ["68", "9", "30", "39"] },
          { displayName: "Home", stats: ["34", "5", "18", "23"] },
        ],
      },
      news: [{ headline: "Test headline", description: "desc" }],
      rotowire: { headline: "Rotowire", description: "Analysis" },
    };
    const result = trimPlayerOverview(raw);
    const stats = result.statistics as Record<string, unknown>[];
    expect(stats).toHaveLength(2);
    expect(stats[0].type).toBe("Regular Season");
    expect((stats[0].stats as Record<string, string>)["GP"]).toBe("68");
    expect((result.news as unknown[]).length).toBe(1);
    expect(result.rotowire).toBeDefined();
  });

  it("handles empty input", () => {
    const result = trimPlayerOverview({});
    expect((result.statistics as unknown[]).length).toBe(0);
  });
});

describe("trimPlayerStats", () => {
  it("extracts categories with per-season stats", () => {
    const raw = {
      categories: [
        {
          name: "quarterback",
          displayName: "Regular Season",
          labels: ["GP", "CMP", "YDS", "TD"],
          statistics: [
            { teamSlug: "kansas-city-chiefs", season: { year: 2025, displayName: "24-25" }, stats: ["17", "410", "4800", "38"], position: "QB" },
          ],
          totals: ["17", "410", "4800", "38"],
        },
      ],
      teams: {
        "kansas-city-chiefs": { displayName: "Kansas City Chiefs" },
      },
    };
    const result = trimPlayerStats(raw) as { categories: Record<string, unknown>[] };
    expect(result.categories).toHaveLength(1);
    const cat = result.categories[0];
    const seasons = cat.seasons as Record<string, unknown>[];
    expect(seasons).toHaveLength(1);
    expect((seasons[0].stats as Record<string, string>).TD).toBe("38");
    expect(seasons[0].team).toBe("Kansas City Chiefs");
    const totals = cat.totals as Record<string, string>;
    expect(totals.TD).toBe("38");
  });

  it("handles missing categories", () => {
    const result = trimPlayerStats({}) as { categories: unknown[] };
    expect(result.categories).toEqual([]);
  });
});

describe("trimPlayerGamelog", () => {
  it("extracts game entries using eventId", () => {
    const raw = {
      labels: ["C/ATT", "YDS", "TD", "INT"],
      events: {
        "401772988": { links: [{ rel: ["summary", "desktop"], href: "https://espn.com/game/401772988" }] },
      },
      seasonTypes: [
        {
          categories: [
            {
              events: [
                { eventId: "401772988", stats: ["22/30", "280", "3", "0"] },
              ],
            },
          ],
        },
      ],
    };
    const result = trimPlayerGamelog(raw);
    expect(result.games).toHaveLength(1);
    expect(result.games[0].gameId).toBe("401772988");
    expect((result.games[0].stats as Record<string, string>).YDS).toBe("280");
    expect(result.games[0].link).toBe("https://espn.com/game/401772988");
  });

  it("handles empty input", () => {
    expect(trimPlayerGamelog({}).games).toEqual([]);
  });
});
