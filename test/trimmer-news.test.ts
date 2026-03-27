import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { trimNews } from "../src/trimmer/news.js";

describe("trimNews", () => {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, "fixtures/news-nhl.json"), "utf-8")
  );
  const result = trimNews(fixture);

  it("returns articles array", () => {
    expect(result).toHaveProperty("articles");
    expect(Array.isArray(result.articles)).toBe(true);
    expect(result.articles.length).toBeGreaterThan(0);
  });

  it("each article has headline", () => {
    for (const article of result.articles) {
      expect(article.headline).toBeTruthy();
    }
  });

  it("articles have published dates", () => {
    for (const article of result.articles) {
      expect(article.published).toBeTruthy();
    }
  });

  it("returns empty articles for empty input", () => {
    const empty = trimNews({});
    expect(empty.articles).toEqual([]);
  });
});
