import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { trimStandings, trimRankings } from "../src/trimmer/standings.js";

describe("trimStandings", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/standings-nhl.json"), "utf-8")
  );
  const result = trimStandings(fixture);

  it("returns groups array", () => {
    expect(result).toHaveProperty("groups");
    expect(Array.isArray(result.groups)).toBe(true);
    expect(result.groups.length).toBeGreaterThan(0);
  });

  it("each group has name and teams", () => {
    for (const group of result.groups) {
      expect(group.name).toBeTruthy();
      const teams = group.teams as Record<string, unknown>[];
      expect(Array.isArray(teams)).toBe(true);
      expect(teams.length).toBeGreaterThan(0);
    }
  });

  it("each team has abbreviation, name, and stats", () => {
    for (const group of result.groups) {
      for (const team of group.teams as Record<string, unknown>[]) {
        expect(team.abbreviation).toBeTruthy();
        expect(team.name).toBeTruthy();
        expect((team.name as string)).not.toBe("Unknown");
        const stats = team.stats as Record<string, string>;
        expect(Object.keys(stats).length).toBeGreaterThan(0);
      }
    }
  });

  it("returns empty groups for empty input", () => {
    const empty = trimStandings({});
    expect(empty.groups).toEqual([]);
  });
});

describe("trimRankings", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/rankings-cfb.json"), "utf-8")
  );
  const result = trimRankings(fixture);

  it("returns polls array", () => {
    expect(result).toHaveProperty("polls");
    expect(Array.isArray(result.polls)).toBe(true);
    expect(result.polls.length).toBeGreaterThan(0);
  });

  it("each poll has name and ranks", () => {
    for (const poll of result.polls) {
      expect(poll.name).toBeTruthy();
      const ranks = poll.ranks as Record<string, unknown>[];
      expect(Array.isArray(ranks)).toBe(true);
      expect(ranks.length).toBeGreaterThan(0);
    }
  });

  it("each rank has team and position", () => {
    for (const poll of result.polls) {
      const first = (poll.ranks as Record<string, unknown>[])[0];
      expect(first.rank).toBe(1);
      expect(first.team).toBeTruthy();
      expect(first.abbreviation).toBeTruthy();
    }
  });

  it("returns empty polls for empty input", () => {
    const empty = trimRankings({});
    expect(empty.polls).toEqual([]);
  });
});
