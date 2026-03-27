import { describe, it, expect } from "vitest";
import { trimLeaders } from "../../src/trimmer/leaders.js";

describe("trimLeaders", () => {
  it("extracts leader categories", () => {
    const raw = { categories: [{ name: "passingYards", displayName: "Passing Yards", leaders: [{ athlete: { displayName: "Patrick Mahomes", team: { abbreviation: "KC" } }, displayValue: "4,800", rank: 1 }] }] };
    const result = trimLeaders(raw);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].leaders[0].player).toBe("Patrick Mahomes");
    expect(result.categories[0].leaders[0].value).toBe("4,800");
  });
  it("handles missing categories", () => {
    expect(trimLeaders({}).categories).toEqual([]);
  });
});
