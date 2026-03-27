# espn-mcp

An MCP server that gives Claude access to live ESPN sports data — scores, stats, rosters, standings, and more across 21 leagues.

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

## Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `lookup` | Resolve a team name, player, or league to ESPN identifiers | `query` |
| `get_scores` | Live and recent scores across leagues | `league`, `team`, `date` |
| `get_team_info` | Team details: roster, schedule, injuries, depth chart, transactions, history | `league`, `team`, `aspect` |
| `get_player_info` | Player details: stats, game log, splits, bio | `league`, `player`, `aspect` |
| `get_game` | Game deep dive: box score, play-by-play, odds, win probability | `gameId`, `detail` |
| `get_standings` | League standings or poll rankings | `league`, `type` |
| `get_leaders` | Statistical leaders by category | `league`, `category` |
| `get_news` | Latest headlines filtered by sport, league, or team | `league`, `team` |

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
- "Give me the play-by-play from the Red Wings' last game"

### Analysis & Comparison
- "How does Andrew Copp compare to the rest of the Red Wings forwards?"
- "What's the Pistons' record when Cade Cunningham doesn't play?"
- "Break down Yaxel Lendeborg's splits — home vs away, by month"

### Playoff & Schedule Intelligence
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

## Development

```bash
git clone https://github.com/ebrodymoore/espn-mcp.git
cd espn-mcp
npm install
npm test          # Run tests
npm run build     # Compile TypeScript
npm run dev       # Run server in dev mode
```

### Regenerate Team Registry

The team registry ships as a static JSON file. To refresh it with current ESPN data:

```bash
npm run generate-registry
```

## License

MIT
