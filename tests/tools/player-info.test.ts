import { describe, it, expect } from "vitest";
import { playerInfoSchema } from "../../src/tools/player-info.js";

describe("playerInfoSchema", () => {
  it("validates correct params", () => {
    const result = playerInfoSchema.safeParse({ league: "nfl", player: "Mahomes", aspect: "stats" });
    expect(result.success).toBe(true);
  });

  it("includes team in parsed output", () => {
    const result = playerInfoSchema.safeParse({
      league: "nhl", player: "John Gibson", team: "red wings", aspect: "stats"
    });
    expect(result.success).toBe(true);
    expect(result.data?.team).toBe("red wings");
  });

  it("team param is optional", () => {
    const result = playerInfoSchema.safeParse({
      league: "nhl", player: "John Gibson", aspect: "stats"
    });
    expect(result.success).toBe(true);
    expect(result.data?.team).toBeUndefined();
  });
});
