#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Cache } from "./cache.js";
import { EspnClient } from "./espn/client.js";
import { loadRegistry } from "./registry/sports.js";
import { Resolver } from "./registry/resolver.js";
import { lookupSchema, lookup } from "./tools/lookup.js";
import { scoresSchema, getScores } from "./tools/scores.js";
import { teamInfoSchema, getTeamInfo } from "./tools/team-info.js";
import { playerInfoSchema, getPlayerInfo } from "./tools/player-info.js";
import { gameSchema, getGame } from "./tools/game.js";
import { standingsSchema, getStandings } from "./tools/standings.js";
import { leadersSchema, getLeaders } from "./tools/leaders.js";
import { newsSchema, getNews } from "./tools/news.js";

const cache = new Cache();
const client = new EspnClient(cache);
const registry = loadRegistry();
const resolver = new Resolver(registry);

const server = new McpServer({
  name: "espn-mcp",
  version: "0.1.0",
});

server.tool(
  "lookup",
  "Resolve a team name, player name, or league to ESPN identifiers. Use this when you're unsure about the exact name or need an ESPN ID.",
  lookupSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await lookup(params, resolver, client), null, 2) }],
  })
);

server.tool(
  "get_scores",
  "Get live and recent scores/results. Can filter by league, team, and date (supports 'yesterday', 'today', 'tomorrow', or YYYY-MM-DD). Use this to find a specific game — returns gameId for use with get_game.",
  scoresSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getScores(params, resolver, client), null, 2) }],
  })
);

server.tool(
  "get_team_info",
  "Get team information. Requires league, team, and aspect (overview|roster|schedule|injuries|depth_chart|transactions|history). For a specific game on a date, use get_scores instead.",
  teamInfoSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getTeamInfo(params, resolver, client), null, 2) }],
  })
);

server.tool(
  "get_player_info",
  "Get player information. Requires league and aspect (overview|stats|gamelog|splits|bio). Accepts player name or ESPN ID.",
  playerInfoSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getPlayerInfo(params, resolver, client), null, 2) }],
  })
);

server.tool(
  "get_game",
  "Get detailed game data. Requires gameId (from get_scores) and detail (summary|boxscore|playbyplay|odds|winprobability). Always pass league for fastest results.",
  gameSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getGame(params, resolver, client), null, 2) }],
  })
);

server.tool(
  "get_standings",
  "Get league standings or poll rankings. Requires league. Rankings available for college sports only.",
  standingsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getStandings(params, resolver, client), null, 2) }],
  })
);

server.tool(
  "get_leaders",
  "Get statistical leaders. Requires league. Optionally filter by category (e.g., 'passing', 'scoring').",
  leadersSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getLeaders(params, resolver, client), null, 2) }],
  })
);

server.tool(
  "get_news",
  "Get latest sports news headlines. Optionally filter by sport or league.",
  newsSchema.shape,
  async (params) => ({
    content: [{ type: "text", text: JSON.stringify(await getNews(params, resolver, client), null, 2) }],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ESPN MCP server running on stdio");
}

main().catch((err) => {
  console.error("Failed to start ESPN MCP server:", err);
  process.exit(1);
});
