/**
 * Integration tests that hit real ESPN API endpoints and validate
 * that trimmers produce non-empty, correctly-shaped output.
 *
 * These tests catch API format drift — the exact class of bug where
 * ESPN changes their response structure and our trimmers silently
 * return empty/default values.
 *
 * Run with: npx vitest run test/integration.test.ts
 * Skip in CI with: npx vitest run --exclude test/integration.test.ts
 */
import { describe, it, expect, beforeAll } from "vitest";
import { Cache } from "../src/cache.js";
import { EspnClient } from "../src/espn/client.js";
import { Resolver } from "../src/registry/resolver.js";
import { loadRegistry } from "../src/registry/sports.js";
import { getScores } from "../src/tools/scores.js";
import { getTeamInfo } from "../src/tools/team-info.js";
import { getPlayerInfo } from "../src/tools/player-info.js";
import { getStandings } from "../src/tools/standings.js";
import { getNews } from "../src/tools/news.js";
import { lookup } from "../src/tools/lookup.js";
import { getGame } from "../src/tools/game.js";

let client: EspnClient;
let resolver: Resolver;

beforeAll(() => {
  const cache = new Cache();
  client = new EspnClient(cache);
  const registry = loadRegistry();
  resolver = new Resolver(registry);
});

const TIMEOUT = 15_000;

describe("get_scores (live API)", () => {
  it("returns games for NHL", async () => {
    const result = await getScores({ league: "nhl" }, resolver, client) as Record<string, unknown>;
    // May have 0 games on an off-day, but should have the games array
    expect(result).toHaveProperty("games");
    const games = result.games as unknown[];
    expect(Array.isArray(games)).toBe(true);

    if (games.length > 0) {
      const game = games[0] as Record<string, unknown>;
      expect(game.gameId).toBeTruthy();
      expect(game.name).toBeTruthy();
      expect(game.status).toBeTruthy();
      expect((game.home as Record<string, unknown>).abbreviation).toBeTruthy();
      expect((game.away as Record<string, unknown>).abbreviation).toBeTruthy();
    }
  }, TIMEOUT);

  it("returns games across all leagues when no league specified", async () => {
    const result = await getScores({}, resolver, client) as Record<string, unknown>;
    expect(result).toHaveProperty("games");
  }, TIMEOUT);
});

describe("get_team_info (live API)", () => {
  it("returns team overview for Red Wings", async () => {
    const result = await getTeamInfo(
      { league: "nhl", team: "Red Wings", aspect: "overview" },
      resolver, client
    ) as Record<string, unknown>;
    expect(result.name).toBeTruthy();
    expect(result.name).not.toBe("Unknown");
    expect(result.abbreviation).toBeTruthy();
    expect(result.id).toBeTruthy();
  }, TIMEOUT);

  it("returns roster with players", async () => {
    const result = await getTeamInfo(
      { league: "nhl", team: "DET", aspect: "roster" },
      resolver, client
    ) as { players: unknown[] };
    expect(result.players.length).toBeGreaterThan(0);
    const first = result.players[0] as Record<string, unknown>;
    expect(first.name).toBeTruthy();
    expect(first.name).not.toBe("Unknown");
    expect(first.id).toBeTruthy();
  }, TIMEOUT);

  it("returns schedule with games", async () => {
    const result = await getTeamInfo(
      { league: "nhl", team: "DET", aspect: "schedule" },
      resolver, client
    ) as { games: unknown[] };
    expect(result.games.length).toBeGreaterThan(0);
    const first = result.games[0] as Record<string, unknown>;
    expect(first.gameId).toBeTruthy();
    expect(first.date).toBeTruthy();
  }, TIMEOUT);
});

describe("get_player_info (live API)", () => {
  it("returns stats for a known player by name", async () => {
    const result = await getPlayerInfo(
      { league: "nhl", player: "Andrew Copp", aspect: "stats" },
      resolver, client
    ) as Record<string, unknown>;

    // Should NOT return empty — this was the original bug
    expect(result).not.toHaveProperty("error");
    const categories = result.categories as unknown[];
    expect(categories).toBeDefined();
    expect(categories.length).toBeGreaterThan(0);

    const cat = categories[0] as Record<string, unknown>;
    expect(cat.position).toBeTruthy();
    const seasons = cat.seasons as unknown[];
    expect(seasons.length).toBeGreaterThan(0);

    const latest = seasons[seasons.length - 1] as Record<string, unknown>;
    const stats = latest.stats as Record<string, string>;
    expect(stats["GP"]).toBeTruthy();
  }, TIMEOUT);

  it("returns overview with statistics splits", async () => {
    const result = await getPlayerInfo(
      { league: "nhl", player: "Andrew Copp", aspect: "overview" },
      resolver, client
    ) as Record<string, unknown>;

    expect(result).not.toHaveProperty("error");
    const statistics = result.statistics as unknown[];
    expect(statistics).toBeDefined();
    expect(statistics.length).toBeGreaterThan(0);

    const first = statistics[0] as Record<string, unknown>;
    expect(first.type).toBeTruthy();
    const stats = first.stats as Record<string, string>;
    expect(Object.keys(stats).length).toBeGreaterThan(0);
  }, TIMEOUT);

  it("returns gamelog with games", async () => {
    const result = await getPlayerInfo(
      { league: "nhl", player: "Andrew Copp", aspect: "gamelog" },
      resolver, client
    ) as { games: unknown[] };

    expect(result.games.length).toBeGreaterThan(0);
    const first = result.games[0] as Record<string, unknown>;
    expect(first.gameId).toBeTruthy();
    const stats = first.stats as Record<string, string>;
    expect(Object.keys(stats).length).toBeGreaterThan(0);
  }, TIMEOUT);

  it("returns stats for a player by numeric ID", async () => {
    const result = await getPlayerInfo(
      { league: "nhl", player: "3042114", aspect: "stats" },
      resolver, client
    ) as Record<string, unknown>;
    expect(result).not.toHaveProperty("error");
    expect((result.categories as unknown[]).length).toBeGreaterThan(0);
  }, TIMEOUT);

  it("returns error for nonexistent player", async () => {
    const result = await getPlayerInfo(
      { league: "nhl", player: "Zzzznotreal Fakename", aspect: "stats" },
      resolver, client
    ) as Record<string, unknown>;
    expect(result).toHaveProperty("error");
  }, TIMEOUT);
});

describe("get_standings (live API)", () => {
  it("returns standings groups for NHL", async () => {
    const result = await getStandings(
      { league: "nhl", type: "standings" },
      resolver, client
    ) as { groups: unknown[] };
    expect(result.groups.length).toBeGreaterThan(0);

    const group = result.groups[0] as Record<string, unknown>;
    expect(group.name).toBeTruthy();
    const teams = group.teams as Record<string, unknown>[];
    expect(teams.length).toBeGreaterThan(0);

    const team = teams[0];
    expect(team.abbreviation).toBeTruthy();
    expect(team.name).not.toBe("Unknown");
    const stats = team.stats as Record<string, string>;
    expect(Object.keys(stats).length).toBeGreaterThan(0);
  }, TIMEOUT);
});

describe("get_news (live API)", () => {
  it("returns news articles for NHL", async () => {
    const result = await getNews(
      { league: "nhl" },
      resolver, client
    ) as { articles: unknown[] };
    expect(result.articles.length).toBeGreaterThan(0);

    const first = result.articles[0] as Record<string, unknown>;
    expect(first.headline).toBeTruthy();
  }, TIMEOUT);

  it("returns news without filters", async () => {
    const result = await getNews({}, resolver, client) as { articles: unknown[] };
    expect(result.articles.length).toBeGreaterThan(0);
  }, TIMEOUT);
});

describe("lookup (live API)", () => {
  it("resolves a team name", async () => {
    const result = await lookup({ query: "Red Wings" }, resolver, client) as Record<string, unknown>;
    expect(result.type).toBe("team");
    expect(result.name).toBe("Detroit Red Wings");
  }, TIMEOUT);

  it("resolves a league name", async () => {
    const result = await lookup({ query: "nhl" }, resolver, client) as Record<string, unknown>;
    expect(result.type).toBe("league");
  }, TIMEOUT);

  it("searches ESPN for a player", async () => {
    const result = await lookup({ query: "Andrew Copp" }, resolver, client) as Record<string, unknown>;
    expect(result).toHaveProperty("matches");
    const matches = result.matches as Record<string, unknown>[];
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].name).toBe("Andrew Copp");
  }, TIMEOUT);
});

describe("get_game (live API)", () => {
  it("returns game summary with teams", async () => {
    // Get a real game ID from scores first
    const scores = await getScores({ league: "nhl" }, resolver, client) as { games: Record<string, unknown>[] };
    if (scores.games.length === 0) return; // No games today, skip

    const gameId = scores.games[0].gameId as string;
    const result = await getGame(
      { gameId, league: "nhl", detail: "summary" },
      resolver, client
    ) as Record<string, unknown>;

    expect(result.status).toBeTruthy();
    expect(result.status).not.toBe("UNKNOWN");
    expect(typeof result.completed).toBe("boolean");
    expect((result.home as Record<string, unknown>).name).not.toBe("Unknown");
    expect((result.away as Record<string, unknown>).name).not.toBe("Unknown");
  }, TIMEOUT);
});
