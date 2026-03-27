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

- "What are today's NBA scores?"
- "Show me the Chiefs roster"
- "How is Patrick Mahomes doing this season?"
- "What are the NFL standings?"
- "Give me the box score from last night's Lakers game"
- "Who leads the NBA in assists?"
- "What's the latest NFL news?"
- "What were the odds for the Super Bowl?"
- "Show me the AP Top 25 college football rankings"
- "Compare LeBron and Steph Curry's stats this season"

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
