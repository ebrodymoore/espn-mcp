import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { trimPlayerOverview, trimPlayerStats, trimPlayerGamelog } from "../src/trimmer/player.js";

describe("trimPlayerStats", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/player-stats-nhl.json"), "utf-8")
  );
  const result = trimPlayerStats(fixture) as { categories: unknown[] };

  it("returns categories array", () => {
    expect(result).toHaveProperty("categories");
    expect(Array.isArray(result.categories)).toBe(true);
    expect(result.categories.length).toBeGreaterThan(0);
  });

  it("each category has position, seasons, and totals", () => {
    for (const cat of result.categories as Record<string, unknown>[]) {
      expect(cat.position).toBeTruthy();
      expect(cat.displayName).toBeTruthy();
      expect(Array.isArray(cat.seasons)).toBe(true);

      const seasons = cat.seasons as Record<string, unknown>[];
      expect(seasons.length).toBeGreaterThan(0);

      expect(cat.totals).toBeDefined();
      const totals = cat.totals as Record<string, string>;
      expect(Object.keys(totals).length).toBeGreaterThan(0);
    }
  });

  it("each season has stats with real values", () => {
    const firstCat = result.categories[0] as Record<string, unknown>;
    const seasons = firstCat.seasons as Record<string, unknown>[];
    const latest = seasons[seasons.length - 1];
    expect(latest.season).toBeTruthy();
    expect(latest.team).toBeTruthy();
    const stats = latest.stats as Record<string, string>;
    expect(stats["GP"]).toBeTruthy();
    expect(stats["G"]).toBeDefined();
    expect(stats["A"]).toBeDefined();
  });

  it("returns empty categories for empty input", () => {
    const empty = trimPlayerStats({}) as { categories: unknown[] };
    expect(empty.categories).toEqual([]);
  });
});

describe("trimPlayerOverview", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/player-overview-nhl.json"), "utf-8")
  );
  const result = trimPlayerOverview(fixture);

  it("returns statistics splits", () => {
    expect(result).toHaveProperty("statistics");
    const stats = result.statistics as unknown[];
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });

  it("each split has type and non-empty stats", () => {
    const stats = result.statistics as Record<string, unknown>[];
    for (const split of stats) {
      expect(split.type).toBeTruthy();
      const statObj = split.stats as Record<string, string>;
      expect(Object.keys(statObj).length).toBeGreaterThan(0);
    }
  });

  it("returns empty statistics for empty input", () => {
    const empty = trimPlayerOverview({});
    expect((empty.statistics as unknown[]).length).toBe(0);
  });
});

describe("trimPlayerGamelog", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/player-gamelog-nhl.json"), "utf-8")
  );
  const result = trimPlayerGamelog(fixture);

  it("returns games array", () => {
    expect(result).toHaveProperty("games");
    expect(Array.isArray(result.games)).toBe(true);
    expect(result.games.length).toBeGreaterThan(0);
  });

  it("each game has gameId and stats", () => {
    for (const game of result.games) {
      expect(game.gameId).toBeTruthy();
      const stats = game.stats as Record<string, string>;
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    }
  });

  it("returns empty games for empty input", () => {
    const empty = trimPlayerGamelog({});
    expect(empty.games).toEqual([]);
  });
});
