import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { trimLeaders } from "../src/trimmer/leaders.js";

describe("trimLeaders", () => {
  // Using synthetic fixture because the v3 leaders endpoint returns 404
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/leaders-synthetic.json"), "utf-8")
  );
  const result = trimLeaders(fixture);

  it("returns categories array", () => {
    expect(result).toHaveProperty("categories");
    expect(Array.isArray(result.categories)).toBe(true);
    expect(result.categories.length).toBeGreaterThan(0);
  });

  it("each category has name and leaders", () => {
    for (const cat of result.categories) {
      expect(cat.name).toBeTruthy();
      expect(Array.isArray(cat.leaders)).toBe(true);
      expect(cat.leaders.length).toBeGreaterThan(0);
    }
  });

  it("each leader has player, team, rank, and value", () => {
    for (const cat of result.categories) {
      for (const leader of cat.leaders) {
        expect(leader.player).toBeTruthy();
        expect(leader.player).not.toBe("Unknown");
        expect(leader.team).toBeTruthy();
        expect(typeof leader.rank).toBe("number");
        expect(leader.rank).toBeGreaterThan(0);
        expect(leader.value).toBeTruthy();
      }
    }
  });

  it("returns empty categories for empty input", () => {
    const empty = trimLeaders({});
    expect(empty.categories).toEqual([]);
  });
});
