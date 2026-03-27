import { describe, it, expect } from "vitest";
import { teamInfoSchema, getTeamInfo } from "../../src/tools/team-info.js";

describe("teamInfoSchema", () => {
  it("validates correct params", () => {
    const result = teamInfoSchema.safeParse({ league: "nfl", team: "chiefs", aspect: "roster" });
    expect(result.success).toBe(true);
  });
  it("rejects missing required params", () => {
    const result = teamInfoSchema.safeParse({ league: "nfl" });
    expect(result.success).toBe(false);
  });
});
