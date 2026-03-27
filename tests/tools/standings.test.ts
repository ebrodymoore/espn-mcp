import { describe, it, expect } from "vitest";
import { standingsSchema } from "../../src/tools/standings.js";

describe("standingsSchema", () => {
  it("validates correct params", () => {
    const result = standingsSchema.safeParse({ league: "nfl" });
    expect(result.success).toBe(true);
  });
  it("defaults type to standings", () => {
    const result = standingsSchema.parse({ league: "nfl" });
    expect(result.type).toBe("standings");
  });
});
