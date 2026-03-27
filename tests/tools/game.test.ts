import { describe, it, expect } from "vitest";
import { gameSchema } from "../../src/tools/game.js";

describe("gameSchema", () => {
  it("validates correct params", () => {
    const result = gameSchema.safeParse({ gameId: "401772988", detail: "boxscore" });
    expect(result.success).toBe(true);
  });

  it("accepts playTypes param", () => {
    const result = gameSchema.safeParse({ gameId: "401772988", detail: "playbyplay", playTypes: "key" });
    expect(result.success).toBe(true);
  });

  it("accepts all playTypes values", () => {
    for (const val of ["key", "scoring", "all"]) {
      const result = gameSchema.safeParse({ gameId: "123", detail: "playbyplay", playTypes: val });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid playTypes", () => {
    const result = gameSchema.safeParse({ gameId: "123", detail: "playbyplay", playTypes: "invalid" });
    expect(result.success).toBe(false);
  });

  it("playTypes is optional", () => {
    const result = gameSchema.safeParse({ gameId: "123", detail: "playbyplay" });
    expect(result.success).toBe(true);
  });
});
