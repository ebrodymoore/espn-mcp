# espn-mcp

An MCP server that gives Claude access to live ESPN sports data — scores, stats, rosters, standings, and more across 21 leagues. Run it locally over stdio, or host it as a Docker container over HTTP with bearer-token authentication.

## Installation

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "espn": {
      "command": "npx",
      "args": ["-y", "espn-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add espn -- npx -y espn-mcp
```

### Remote (HTTP + Docker)

Set `MCP_TRANSPORT=http` to serve MCP over Streamable HTTP at `POST /mcp` (plus an unauthenticated `GET /health`).

| Variable | Default | Purpose |
|----------|---------|---------|
| `MCP_TRANSPORT` | `stdio` | `stdio` or `http` |
| `HOST` / `PORT` | `127.0.0.1` / `3000` | Listen address |
| `MCP_AUTH_TOKENS` | — | Comma-separated bearer tokens accepted on `/mcp` |
| `MCP_AUTH_TOKEN_FILE` | — | File with one token per line (e.g. a Docker secret) |
| `MCP_ALLOW_UNAUTHENTICATED` | — | `true` to allow listening on a non-loopback address with no tokens |

Clients must send `Authorization: Bearer <token>`; anything else gets `401`. The server refuses to start on a non-loopback address without tokens unless you opt out explicitly.

#### Build and run with Docker Compose

```bash
mkdir -p secrets
openssl rand -hex 32 > secrets/mcp_auth_tokens   # one token per line; add more to rotate
chmod 644 secrets/mcp_auth_tokens                 # container runs as uid 1000 and must read it
cp .env.example .env                              # optional: port, bind address, limits, image tag
docker compose up -d --build
curl http://127.0.0.1:3000/health                 # -> ok
```

Connect Claude Code to it:

```bash
claude mcp add --transport http espn http://127.0.0.1:3000/mcp \
  --header "Authorization: Bearer $(head -1 secrets/mcp_auth_tokens)"
```

#### Hosting

- **Bind address:** compose publishes on `127.0.0.1` by default. To reach it from other machines set `BIND_ADDRESS=0.0.0.0` in `.env`, but put a TLS-terminating reverse proxy (Caddy, Traefik, nginx, Cloudflare Tunnel) in front — bearer tokens sent over plain HTTP can be sniffed.
- **Publishing the image:** `docker build -t ghcr.io/<you>/espn-mcp:latest . && docker push ghcr.io/<you>/espn-mcp:latest` (after `docker login ghcr.io`). For a mixed-architecture fleet, use `docker buildx build --platform linux/amd64,linux/arm64 -t ... --push .`. On the host, set `IMAGE` in `.env` and run `docker compose pull && docker compose up -d`.
- **Rotating tokens:** add the new token to `secrets/mcp_auth_tokens`, `docker compose restart`, update clients, then remove the old token and restart again.
- **Logs:** `docker compose logs -f espn-mcp`.

## Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `lookup` | Resolve a team name, player, or league to ESPN identifiers | `query` |
| `get_scores` | Live and recent scores across leagues | `league`, `team`, `date` |
| `get_team_info` | Team details: roster, schedule, injuries, depth chart, transactions, history | `league`, `team`, `aspect` |
| `get_player_info` | Player details: stats, game log, splits, bio | `league`, `player`, `aspect`, `team` (optional) |
| `get_game` | Game deep dive: box score, play-by-play, odds, win probability | `gameId`, `detail` |
| `get_standings` | League standings or poll rankings | `league`, `type` |
| `get_leaders` | Statistical leaders by category | `league`, `category` |
| `get_news` | Latest headlines filtered by sport or league | `league` |

`sport` is always optional — it's inferred from `league` automatically.

## Supported Sports

### Full Depth
NFL, NBA, MLB, NHL — box scores, play-by-play, player stats, odds, win probability, injuries, transactions

### Strong
College Football, College Basketball, College Baseball, WNBA, UFL, College Hockey — game summaries, plays, odds, athletes

### Good
Soccer (250 leagues including EPL, La Liga, MLS, Champions League), PLL, NLL, AFL — scores, teams, standings; top soccer leagues have odds and commentary

### Basic
Golf (PGA), F1, NASCAR, IndyCar, UFC/MMA, Tennis, Rugby, CFL — scores, teams, standings, news

## Example Queries

Once installed, ask Claude things like:

### Quick Lookups
- "How is Kevin McGonigle doing so far this season?"
- "What are Justin Verlander's career stats?"
- "Are there any active MLB games right now?"
- "Give me the key plays from the Red Wings' last game"

### Analysis & Comparison
- "How does Andrew Copp compare to the rest of the Red Wings forwards?"
- "What's the Pistons' record when Cade Cunningham doesn't play?"
- "Break down Yaxel Lendeborg's splits — home vs away, by month"
- "How difficult is the Red Wings' remaining schedule vs other teams in the playoff hunt?"
- "How has Detroit performed against the teams remaining on their schedule?"
- "Break down the Eastern Conference wild card race for me"

### Build On Top Of It
These aren't canned responses — Claude is combining multiple tool calls, cross-referencing data, and doing real analysis. This means you can build agents and workflows that:
- **Scout opponents** — pull rosters, recent form, and head-to-head records before game day
- **Track prospect development** — monitor game logs and splits for players across leagues
- **Power betting models** — feed live odds, win probability, and historical stats into your own pipelines
- **Automate recaps** — generate post-game summaries from box scores and play-by-play data
- **Monitor playoff races** — calculate strength of schedule and remaining-game scenarios on demand

## How It Works

The server sits between Claude and ESPN's public API:

1. **Smart resolution** — "Niners" resolves to San Francisco 49ers (ESPN ID 25) via a built-in registry of 1,200+ teams with aliases
2. **Response trimming** — ESPN responses can be 500KB+. The server extracts only what's relevant (a box score trims down to ~5KB)
3. **Caching** — In-memory TTL cache prevents redundant API calls (30s for live scores, 1hr for rosters, etc.)
4. **Concurrency limiting** — Max 2 simultaneous ESPN requests to avoid rate limiting
5. **Transports** — stdio by default; Streamable HTTP (stateless, one server per request) when `MCP_TRANSPORT=http`, with bearer-token auth on `/mcp`. Tokens are compared in constant time and can be supplied via env var or a mounted secret file

## Development

```bash
git clone https://github.com/cdbailey/espn-mcp.git
cd espn-mcp
npm install
npm test                       # Run unit tests
RUN_INTEGRATION=1 npm test     # Run unit + integration tests (hits live ESPN API)
npm run build                  # Compile TypeScript
npm run dev                    # Run server in dev mode (stdio)
MCP_TRANSPORT=http MCP_AUTH_TOKENS=dev-token npm run dev   # Run over HTTP on 127.0.0.1:3000
```

### Regenerate Team Registry

The team registry ships as a static JSON file. To refresh it with current ESPN data:

```bash
npm run generate-registry
```

## License

MIT
