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
} from "../../src/espn/endpoints.js";

describe("ESPN URL builders", () => {
  describe("scoreboardUrl", () => {
    it("builds basic scoreboard URL", () => {
      expect(scoreboardUrl("football", "nfl")).toBe(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
      );
    });

    it("appends date param", () => {
      expect(scoreboardUrl("football", "nfl", "20260327")).toBe(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20260327"
      );
    });
  });

  describe("teamUrl", () => {
    it("builds team URL by ID", () => {
      expect(teamUrl("football", "nfl", "12")).toBe(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12"
      );
    });
  });

  describe("teamAspectUrl", () => {
    it("builds roster URL", () => {
      expect(teamAspectUrl("football", "nfl", "12", "roster")).toBe(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12/roster"
      );
    });

    it("maps depth_chart to depthcharts", () => {
      expect(teamAspectUrl("football", "nfl", "12", "depth_chart")).toBe(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/12/depthcharts"
      );
    });
  });

  describe("playerUrl", () => {
    it("builds player overview URL", () => {
      expect(playerUrl("football", "nfl", "4432577", "overview")).toBe(
        "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/4432577/overview"
      );
    });

    it("builds player gamelog URL", () => {
      expect(playerUrl("basketball", "nba", "1234", "gamelog")).toBe(
        "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/1234/gamelog"
      );
    });
  });

  describe("gameSummaryUrl", () => {
    it("builds summary URL with event ID", () => {
      expect(gameSummaryUrl("football", "nfl", "401772988")).toBe(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401772988"
      );
    });
  });

  describe("standingsUrl", () => {
    it("builds standings URL", () => {
      expect(standingsUrl("football", "nfl")).toBe(
        "https://site.api.espn.com/apis/v2/sports/football/nfl/standings"
      );
    });
  });

  describe("rankingsUrl", () => {
    it("builds rankings URL", () => {
      expect(rankingsUrl("football", "college-football")).toBe(
        "https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings"
      );
    });
  });

  describe("leadersUrl", () => {
    it("builds leaders URL", () => {
      expect(leadersUrl("football", "nfl")).toBe(
        "https://sports.core.api.espn.com/v3/sports/football/leagues/nfl/leaders"
      );
    });
  });

  describe("newsUrl", () => {
    it("builds global news URL", () => {
      expect(newsUrl()).toBe(
        "https://now.core.api.espn.com/v1/sports/news"
      );
    });

    it("builds sport-filtered news URL", () => {
      expect(newsUrl("football")).toBe(
        "https://now.core.api.espn.com/v1/sports/news?sport=football"
      );
    });

    it("builds league-filtered news URL", () => {
      expect(newsUrl("football", "nfl")).toBe(
        "https://now.core.api.espn.com/v1/sports/news?sport=football&leagues=nfl"
      );
    });
  });

  describe("searchUrl", () => {
    it("builds search URL with query", () => {
      expect(searchUrl("LeBron")).toBe(
        "https://site.web.api.espn.com/apis/search/v2?query=LeBron&limit=10"
      );
    });
  });
});
