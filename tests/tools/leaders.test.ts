import { describe, it, expect } from "vitest";
import { leadersSchema } from "../../src/tools/leaders.js";

describe("leadersSchema", () => {
  it("validates correct params", () => {
    const result = leadersSchema.safeParse({ league: "nfl" });
    expect(result.success).toBe(true);
  });
});
