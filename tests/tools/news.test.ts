import { describe, it, expect } from "vitest";
import { newsSchema } from "../../src/tools/news.js";

describe("newsSchema", () => {
  it("validates with no params", () => {
    const result = newsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
