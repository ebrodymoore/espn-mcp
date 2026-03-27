const SITE_API = "https://site.api.espn.com/apis";
const CORE_API = "https://sports.core.api.espn.com";
const WEB_API = "https://site.web.api.espn.com/apis";
const NEWS_API = "https://now.core.api.espn.com/v1/sports/news";

const ASPECT_PATH_MAP: Record<string, string> = {
  depth_chart: "depthcharts",
};

export function scoreboardUrl(
  sport: string,
  league: string,
  date?: string
): string {
  const base = `${SITE_API}/site/v2/sports/${sport}/${league}/scoreboard`;
  return date ? `${base}?dates=${date}` : base;
}

export function teamUrl(sport: string, league: string, teamId: string): string {
  return `${SITE_API}/site/v2/sports/${sport}/${league}/teams/${teamId}`;
}

export function teamAspectUrl(
  sport: string,
  league: string,
  teamId: string,
  aspect: string
): string {
  const pathSegment = ASPECT_PATH_MAP[aspect] ?? aspect;
  return `${SITE_API}/site/v2/sports/${sport}/${league}/teams/${teamId}/${pathSegment}`;
}

export function playerUrl(
  sport: string,
  league: string,
  playerId: string,
  aspect: string
): string {
  return `${WEB_API}/common/v3/sports/${sport}/${league}/athletes/${playerId}/${aspect}`;
}

export function gameSummaryUrl(
  sport: string,
  league: string,
  eventId: string
): string {
  return `${SITE_API}/site/v2/sports/${sport}/${league}/summary?event=${eventId}`;
}

export function standingsUrl(sport: string, league: string): string {
  return `${SITE_API}/v2/sports/${sport}/${league}/standings`;
}

export function rankingsUrl(sport: string, league: string): string {
  return `${SITE_API}/site/v2/sports/${sport}/${league}/rankings`;
}

export function leadersUrl(sport: string, league: string): string {
  return `${CORE_API}/v3/sports/${sport}/leagues/${league}/leaders`;
}

export function newsUrl(sport?: string, league?: string): string {
  const params = new URLSearchParams();
  if (sport) params.set("sport", sport);
  if (league) params.set("leagues", league);
  const qs = params.toString();
  return qs ? `${NEWS_API}?${qs}` : NEWS_API;
}

export function searchUrl(query: string, limit = 10): string {
  return `${WEB_API}/search/v2?query=${encodeURIComponent(query)}&limit=${limit}`;
}
