import { describe, it, expect } from "vitest";
import { playerInfoSchema } from "../../src/tools/player-info.js";

describe("playerInfoSchema", () => {
  it("validates correct params", () => {
    const result = playerInfoSchema.safeParse({ league: "nfl", player: "Mahomes", aspect: "stats" });
    expect(result.success).toBe(true);
  });
});
