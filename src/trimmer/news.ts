import { safe } from "./common.js";

interface TrimmedArticle {
  headline: string;
  description: string | null;
  published: string | null;
  link: string | null;
}

export function trimNews(raw: Record<string, unknown>): { articles: TrimmedArticle[] } {
  const articlesArr = (raw?.headlines as unknown[]) ?? (raw?.articles as unknown[]) ?? [];

  const articles: TrimmedArticle[] = articlesArr.map((a: unknown) => {
    const article = a as Record<string, unknown>;
    return {
      headline: (article.headline as string) ?? "",
      description: (article.description as string) ?? null,
      published: (article.published as string) ?? null,
      link: safe(() => ((article.links as Record<string, unknown>).web as Record<string, unknown>).href as string) ?? null,
    };
  });

  return { articles };
}
