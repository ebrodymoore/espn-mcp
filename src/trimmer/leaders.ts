import { safe } from "./common.js";

interface TrimmedLeader {
  rank: number;
  player: string;
  team: string;
  value: string;
}

interface TrimmedCategory {
  name: string;
  leaders: TrimmedLeader[];
}

export function trimLeaders(raw: Record<string, unknown>): { categories: TrimmedCategory[] } {
  const categoriesArr = (raw?.categories as unknown[]) ?? [];

  const categories: TrimmedCategory[] = categoriesArr.map((c: unknown) => {
    const cat = c as Record<string, unknown>;
    const leadersArr = (cat.leaders as unknown[]) ?? [];

    const leaders: TrimmedLeader[] = leadersArr.map((l: unknown) => {
      const leader = l as Record<string, unknown>;
      const athlete = (leader.athlete as Record<string, unknown>) ?? {};
      return {
        rank: (leader.rank as number) ?? 0,
        player: (athlete.displayName as string) ?? "Unknown",
        team: safe(() => (athlete.team as Record<string, unknown>).abbreviation as string) ?? "",
        value: (leader.displayValue as string) ?? "",
      };
    });

    return {
      name: (cat.displayName as string) ?? (cat.name as string) ?? "",
      leaders,
    };
  });

  return { categories };
}
