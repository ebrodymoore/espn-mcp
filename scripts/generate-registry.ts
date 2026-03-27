import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_API = "https://site.api.espn.com/apis/site/v2/sports";

const LEAGUES = [
  { sport: "football", league: "nfl", name: "National Football League", aliases: ["pro football"] },
  { sport: "football", league: "college-football", name: "NCAA Football", aliases: ["cfb", "ncaa football", "college football"] },
  { sport: "football", league: "ufl", name: "United Football League", aliases: [] },
  { sport: "basketball", league: "nba", name: "National Basketball Association", aliases: [] },
  { sport: "basketball", league: "wnba", name: "WNBA", aliases: ["womens basketball"] },
  { sport: "basketball", league: "mens-college-basketball", name: "NCAA Men's Basketball", aliases: ["cbb", "ncaa basketball", "march madness", "college basketball"] },
  { sport: "basketball", league: "womens-college-basketball", name: "NCAA Women's Basketball", aliases: ["wcbb", "womens college basketball"] },
  { sport: "baseball", league: "mlb", name: "Major League Baseball", aliases: [] },
  { sport: "baseball", league: "college-baseball", name: "NCAA Baseball", aliases: [] },
  { sport: "hockey", league: "nhl", name: "National Hockey League", aliases: [] },
  { sport: "hockey", league: "mens-college-hockey", name: "NCAA Men's Hockey", aliases: [] },
  { sport: "soccer", league: "usa.1", name: "Major League Soccer", aliases: ["mls"] },
  { sport: "soccer", league: "eng.1", name: "English Premier League", aliases: ["premier league", "epl", "prem"] },
  { sport: "soccer", league: "esp.1", name: "La Liga", aliases: ["la liga", "spanish league"] },
  { sport: "soccer", league: "ger.1", name: "Bundesliga", aliases: ["bundesliga", "german league"] },
  { sport: "soccer", league: "ita.1", name: "Serie A", aliases: ["serie a", "italian league"] },
  { sport: "soccer", league: "fra.1", name: "Ligue 1", aliases: ["ligue 1", "french league"] },
  { sport: "soccer", league: "uefa.champions", name: "UEFA Champions League", aliases: ["champions league", "ucl"] },
  { sport: "golf", league: "pga", name: "PGA Tour", aliases: ["pga tour"] },
  { sport: "racing", league: "f1", name: "Formula 1", aliases: ["formula one", "f1"] },
  { sport: "mma", league: "ufc", name: "UFC", aliases: ["ultimate fighting", "mma"] },
];

interface TeamEntry {
  id: string;
  name: string;
  abbreviation: string;
  aliases: string[];
}

async function fetchTeams(sport: string, league: string): Promise<Record<string, TeamEntry>> {
  const url = `${SITE_API}/${sport}/${league}/teams?limit=200`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      console.error(`  Skipping ${league}: HTTP ${res.status}`);
      return {};
    }

    const data = (await res.json()) as Record<string, unknown>;
    const sports = (data.sports as unknown[]) ?? [];
    const teams: Record<string, TeamEntry> = {};

    for (const sportObj of sports) {
      const leagues = ((sportObj as Record<string, unknown>).leagues as unknown[]) ?? [];
      for (const leagueObj of leagues) {
        const teamArr = ((leagueObj as Record<string, unknown>).teams as unknown[]) ?? [];
        for (const t of teamArr) {
          const team = (t as Record<string, unknown>).team as Record<string, unknown>;
          if (!team) continue;
          const abbr = ((team.abbreviation as string) ?? "").toLowerCase();
          const name = (team.displayName as string) ?? "";
          const shortName = (team.shortDisplayName as string) ?? "";
          const city = (team.location as string) ?? "";
          const nickname = (team.name as string) ?? "";

          const aliases = new Set<string>();
          if (shortName) aliases.add(shortName.toLowerCase());
          if (city) aliases.add(city.toLowerCase());
          if (nickname) aliases.add(nickname.toLowerCase());
          if (name) aliases.add(name.toLowerCase());
          aliases.delete(abbr);

          teams[abbr] = {
            id: (team.id as string) ?? "",
            name,
            abbreviation: (team.abbreviation as string) ?? "",
            aliases: Array.from(aliases),
          };
        }
      }
    }

    return teams;
  } catch (err) {
    console.error(`  Error fetching ${league}:`, err);
    return {};
  }
}

async function main() {
  console.log("Generating ESPN registry...\n");

  const registry: Record<string, unknown> = {};

  for (const { sport, league, name, aliases } of LEAGUES) {
    console.log(`Fetching ${name} (${league})...`);
    const teams = await fetchTeams(sport, league);
    console.log(`  Found ${Object.keys(teams).length} teams`);

    registry[league] = { sport, league, name, aliases, teams };

    await new Promise((r) => setTimeout(r, 200));
  }

  const dir = dirname(fileURLToPath(import.meta.url));
  const outPath = join(dir, "..", "data", "registry.json");
  writeFileSync(outPath, JSON.stringify(registry, null, 2));
  console.log(`\nRegistry written to ${outPath}`);
  console.log(`Total leagues: ${Object.keys(registry).length}`);
}

main().catch(console.error);
