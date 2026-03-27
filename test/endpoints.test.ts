import { describe, it, expect } from "vitest";
import {
  scoreboardUrl,
  teamUrl,
  teamAspectUrl,
  playerUrl,
  gameSummaryUrl,
  standingsUrl,
  rankingsUrl,
  leadersUrl,
  newsUrl,
  searchUrl,
} from "../src/espn/endpoints.js";

describe("endpoints", () => {
  it("scoreboardUrl without date", () => {
    expect(scoreboardUrl("hockey", "nhl")).toBe(
      "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard"
    );
  });

  it("scoreboardUrl with date", () => {
    expect(scoreboardUrl("hockey", "nhl", "20250101")).toContain("?dates=20250101");
  });

  it("teamUrl", () => {
    expect(teamUrl("hockey", "nhl", "5")).toContain("/teams/5");
  });

  it("teamAspectUrl uses path mapping for depth_chart", () => {
    expect(teamAspectUrl("hockey", "nhl", "5", "depth_chart")).toContain("/depthcharts");
  });

  it("teamAspectUrl passes through unmapped aspects", () => {
    expect(teamAspectUrl("hockey", "nhl", "5", "roster")).toContain("/roster");
  });

  it("playerUrl", () => {
    const url = playerUrl("hockey", "nhl", "3042114", "stats");
    expect(url).toContain("/athletes/3042114/stats");
  });

  it("gameSummaryUrl", () => {
    expect(gameSummaryUrl("hockey", "nhl", "12345")).toContain("?event=12345");
  });

  it("standingsUrl", () => {
    expect(standingsUrl("hockey", "nhl")).toContain("/hockey/nhl/standings");
  });

  it("rankingsUrl", () => {
    expect(rankingsUrl("football", "college-football")).toContain("/rankings");
  });

  it("leadersUrl", () => {
    expect(leadersUrl("hockey", "nhl")).toContain("/leagues/nhl/leaders");
  });

  it("newsUrl with no args", () => {
    expect(newsUrl()).not.toContain("?");
  });

  it("newsUrl with sport and league", () => {
    const url = newsUrl("hockey", "nhl");
    expect(url).toContain("sport=hockey");
    expect(url).toContain("leagues=nhl");
  });

  it("searchUrl encodes query", () => {
    expect(searchUrl("Andrew Copp")).toContain("query=Andrew%20Copp");
  });
});
