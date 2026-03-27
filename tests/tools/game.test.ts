import { describe, it, expect } from "vitest";
import { gameSchema } from "../../src/tools/game.js";

describe("gameSchema", () => {
  it("validates correct params", () => {
    const result = gameSchema.safeParse({ gameId: "401772988", detail: "boxscore" });
    expect(result.success).toBe(true);
  });
});
