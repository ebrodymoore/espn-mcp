import { safe, warnMissing } from "./common.js";

// --- Boxscore ---

interface TrimmedPlayerLine {
  name: string;
  group: string;
  stats: Record<string, string>;
}

interface TrimmedTeamBox {
  name: string;
  players: TrimmedPlayerLine[];
  teamStats: Record<string, string>;
}

interface TrimmedBoxscore {
  teams: TrimmedTeamBox[];
  lineScores: { home: string[]; away: string[] };
}

export function trimBoxscore(raw: Record<string, unknown>): TrimmedBoxscore {
  const boxscore = raw?.boxscore as Record<string, unknown> | undefined;
  const playersArr = (boxscore?.players as unknown[]) ?? [];
  const teamsArr = (boxscore?.teams as unknown[]) ?? [];

  const teams: TrimmedTeamBox[] = playersArr.map((p: unknown) => {
    const pObj = p as Record<string, unknown>;
    const teamAbbr =
      safe(() => (pObj.team as Record<string, unknown>).abbreviation as string) ?? "???";
    const statistics = (pObj.statistics as unknown[]) ?? [];

    const players: TrimmedPlayerLine[] = [];
    for (const statGroup of statistics) {
      const sg = statGroup as Record<string, unknown>;
      const groupName = (sg.name as string) ?? "unknown";
      const labels = (sg.labels as string[]) ?? [];
      const athletes = (sg.athletes as unknown[]) ?? [];

      for (const athlete of athletes) {
        const a = athlete as Record<string, unknown>;
        const name =
          safe(
            () => (a.athlete as Record<string, unknown>).displayName as string
          ) ?? "Unknown";
        const statsArr = (a.stats as string[]) ?? [];
        const statsObj: Record<string, string> = {};
        labels.forEach((label, i) => {
          statsObj[label] = statsArr[i] ?? "";
        });
        players.push({ name, group: groupName, stats: statsObj });
      }
    }

    // Team-level stats
    const matchingTeam = teamsArr.find((t: unknown) => {
      const tObj = t as Record<string, unknown>;
      return (
        safe(() => (tObj.team as Record<string, unknown>).abbreviation) ===
        teamAbbr
      );
    }) as Record<string, unknown> | undefined;

    const teamStatistics = (matchingTeam?.statistics as unknown[]) ?? [];
    const teamStats: Record<string, string> = {};
    for (const stat of teamStatistics) {
      const s = stat as Record<string, unknown>;
      if (s.name && s.displayValue) {
        teamStats[s.name as string] = s.displayValue as string;
      }
    }

    return { name: teamAbbr, players, teamStats };
  });

  // Line scores from header
  const lineScores = extractLineScores(raw);

  return { teams, lineScores };
}

function extractLineScores(raw: Record<string, unknown>): {
  home: string[];
  away: string[];
} {
  const header = raw?.header as Record<string, unknown> | undefined;
  const comps = (header?.competitions as unknown[]) ?? [];
  const comp = comps[0] as Record<string, unknown> | undefined;
  const competitors = (comp?.competitors as unknown[]) ?? [];

  let home: string[] = [];
  let away: string[] = [];

  for (const c of competitors) {
    const cObj = c as Record<string, unknown>;
    const scores = ((cObj.linescores as unknown[]) ?? []).map(
      (ls: unknown) => ((ls as Record<string, unknown>).displayValue as string) ?? "0"
    );
    if (cObj.homeAway === "home") home = scores;
    else away = scores;
  }

  return { home, away };
}

// --- Play-by-Play ---

interface TrimmedPlay {
  text: string;
  type: string;
  clock: string | null;
  period: number | null;
  homeScore: string | null;
  awayScore: string | null;
  scoringPlay: boolean;
}

interface TrimmedScoringPlay {
  text: string;
  clock: string | null;
  period: number | null;
  homeScore: number;
  awayScore: number;
  team: string;
}

interface TrimmedPlayByPlay {
  plays: TrimmedPlay[];
  scoringPlays: TrimmedScoringPlay[];
}

export function trimPlayByPlay(raw: Record<string, unknown>): TrimmedPlayByPlay {
  const playsArr = (raw?.plays as unknown[]) ?? [];
  const scoringArr = (raw?.scoringPlays as unknown[]) ?? [];

  const plays: TrimmedPlay[] = playsArr.map((p: unknown) => {
    const play = p as Record<string, unknown>;
    return {
      text: (play.text as string) ?? "",
      type: safe(() => (play.type as Record<string, unknown>).text as string) ?? "",
      clock: safe(() => (play.clock as Record<string, unknown>).displayValue as string) ?? null,
      period: safe(() => (play.period as Record<string, unknown>).number as number) ?? null,
      homeScore: (play.homeScore as string) ?? null,
      awayScore: (play.awayScore as string) ?? null,
      scoringPlay: (play.scoringPlay as boolean) ?? false,
    };
  });

  const scoringPlays: TrimmedScoringPlay[] = scoringArr.map((p: unknown) => {
    const play = p as Record<string, unknown>;
    return {
      text: (play.text as string) ?? "",
      clock: safe(() => (play.clock as Record<string, unknown>).displayValue as string) ?? null,
      period: safe(() => (play.period as Record<string, unknown>).number as number) ?? null,
      homeScore: (play.homeScore as number) ?? 0,
      awayScore: (play.awayScore as number) ?? 0,
      team: safe(() => (play.team as Record<string, unknown>).abbreviation as string) ?? "",
    };
  });

  return { plays, scoringPlays };
}

// --- Odds ---

interface TrimmedOddsLine {
  spread: string;
  overUnder: number;
  provider: string;
}

export function trimOdds(raw: Record<string, unknown>): { lines: TrimmedOddsLine[] } {
  const oddsArr = (raw?.odds as unknown[]) ?? [];

  const lines: TrimmedOddsLine[] = oddsArr.map((o: unknown) => {
    const odds = o as Record<string, unknown>;
    return {
      spread: (odds.details as string) ?? "",
      overUnder: (odds.overUnder as number) ?? 0,
      provider:
        safe(() => (odds.provider as Record<string, unknown>).name as string) ?? "",
    };
  });

  return { lines };
}

// --- Win Probability ---

interface WinProbPoint {
  homeWinPct: number;
  playId: string;
}

export function trimWinProbability(
  raw: Record<string, unknown>
): { dataPoints: WinProbPoint[] } {
  const wpArr = (raw?.winprobability as unknown[]) ?? [];

  const dataPoints: WinProbPoint[] = wpArr.map((wp: unknown) => {
    const point = wp as Record<string, unknown>;
    return {
      homeWinPct: (point.homeWinPercentage as number) ?? 0,
      playId: (point.playId as string) ?? "",
    };
  });

  return { dataPoints };
}

// --- Game Summary (combined) ---

interface TrimmedGameSummary {
  status: string;
  completed: boolean;
  home: { name: string; abbreviation: string; score: string | null };
  away: { name: string; abbreviation: string; score: string | null };
  lineScores: { home: string[]; away: string[] };
  scoringPlays: TrimmedScoringPlay[];
}

export function trimGameSummary(raw: Record<string, unknown>): TrimmedGameSummary {
  const header = raw?.header as Record<string, unknown> | undefined;
  const comps = (header?.competitions as unknown[]) ?? [];
  const comp = comps[0] as Record<string, unknown> | undefined;
  const statusType = safe(
    () => (comp?.status as Record<string, unknown>).type as Record<string, unknown>
  );
  const competitors = (comp?.competitors as unknown[]) ?? [];

  const extractCompetitor = (homeAway: string) => {
    const c = competitors.find(
      (x: unknown) => (x as Record<string, unknown>).homeAway === homeAway
    ) as Record<string, unknown> | undefined;
    const team = c?.team as Record<string, unknown> | undefined;
    return {
      name: (team?.displayName as string) ?? "Unknown",
      abbreviation: (team?.abbreviation as string) ?? "???",
      score: (c?.score as string) ?? null,
    };
  };

  const lineScores = extractLineScores(raw);
  const { scoringPlays } = trimPlayByPlay(raw);

  return {
    status: (statusType?.name as string) ?? "UNKNOWN",
    completed: (statusType?.completed as boolean) ?? false,
    home: extractCompetitor("home"),
    away: extractCompetitor("away"),
    lineScores,
    scoringPlays,
  };
}
