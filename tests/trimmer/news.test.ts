import { describe, it, expect } from "vitest";
import { trimNews } from "../../src/trimmer/news.js";

describe("trimNews", () => {
  it("extracts article essentials", () => {
    const raw = { articles: [{ headline: "Chiefs Win", description: "Kansas City wins", published: "2026-02-09T00:00:00Z", links: { web: { href: "https://espn.com/article/123" } }, images: [{ url: "https://cdn.espn.com/photo.jpg" }] }] };
    const result = trimNews(raw);
    expect(result.articles).toHaveLength(1);
    expect(result.articles[0]).toEqual({ headline: "Chiefs Win", description: "Kansas City wins", published: "2026-02-09T00:00:00Z", link: "https://espn.com/article/123" });
  });
  it("handles missing articles", () => {
    expect(trimNews({}).articles).toEqual([]);
  });
  it("strips images", () => {
    const raw = { articles: [{ headline: "Test", images: [{ url: "https://cdn.espn.com/photo.jpg" }] }] };
    expect(JSON.stringify(trimNews(raw))).not.toContain("cdn.espn.com");
  });
});
