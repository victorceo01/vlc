/**
 * Mock/seed news articles. Real ingestion is a later phase. All articles are
 * stored with source='mock'. `symbols` links an article to seeded companies.
 */
export interface SeedNews {
  title: string;
  summary: string;
  body: string;
  sourceName: string;
  publishedAt: string;
  symbols: string[];
}

export const SEED_NEWS: SeedNews[] = [
  {
    title: "Cement makers report higher volumes on infrastructure demand",
    summary:
      "Industrial-goods producers cite public infrastructure projects as a driver of demand in the latest period.",
    body: "This is a mock/seed article used to populate the news feed during MVP development. It does not reflect real events and is not investment advice.",
    sourceName: "Seed Newsroom",
    publishedAt: "2026-08-30T09:00:00Z",
    symbols: ["DANGCEM", "BUACEMENT", "WAPCO"],
  },
  {
    title: "Telecom operators expand data capacity ahead of demand",
    summary:
      "Network operators outline plans to grow data infrastructure across major cities.",
    body: "Mock/seed article for MVP development. Not real news; not investment advice.",
    sourceName: "Seed Newsroom",
    publishedAt: "2026-08-28T14:30:00Z",
    symbols: ["MTNN", "AIRTELAFRI"],
  },
  {
    title: "Banking sector maintains strong capital positions",
    summary:
      "Tier-1 lenders report resilient balance sheets in a challenging macro environment.",
    body: "Mock/seed article for MVP development. Not real news; not investment advice.",
    sourceName: "Seed Newsroom",
    publishedAt: "2026-08-25T08:15:00Z",
    symbols: ["GTCO", "ZENITHBANK", "UBA", "ACCESSCORP", "FBNH"],
  },
  {
    title: "Consumer-goods firms navigate input-cost pressures",
    summary:
      "Food and beverage manufacturers discuss margin management amid currency and input costs.",
    body: "Mock/seed article for MVP development. Not real news; not investment advice.",
    sourceName: "Seed Newsroom",
    publishedAt: "2026-08-22T11:45:00Z",
    symbols: ["NESTLE", "NB", "FLOURMILL", "DANGSUGAR"],
  },
  {
    title: "Energy producers focus on gas and downstream investment",
    summary:
      "Oil & gas companies highlight gas monetisation and distribution investments.",
    body: "Mock/seed article for MVP development. Not real news; not investment advice.",
    sourceName: "Seed Newsroom",
    publishedAt: "2026-08-20T16:00:00Z",
    symbols: ["SEPLAT", "TOTAL", "OANDO"],
  },
  {
    title: "Agro-industrial groups report steady plantation output",
    summary:
      "Palm-oil producers point to steady output and pricing in the segment.",
    body: "Mock/seed article for MVP development. Not real news; not investment advice.",
    sourceName: "Seed Newsroom",
    publishedAt: "2026-08-18T10:20:00Z",
    symbols: ["OKOMUOIL", "PRESCO"],
  },
  {
    title: "Conglomerate outlines power-generation expansion",
    summary:
      "Diversified group discusses capacity growth across its power portfolio.",
    body: "Mock/seed article for MVP development. Not real news; not investment advice.",
    sourceName: "Seed Newsroom",
    publishedAt: "2026-08-15T13:10:00Z",
    symbols: ["TRANSCORP"],
  },
  {
    title: "NGX All-Share Index edges higher in light trading",
    summary:
      "The benchmark index posted modest gains as advancers outnumbered decliners.",
    body: "Mock/seed article for MVP development. Not real news; not investment advice.",
    sourceName: "Seed Newsroom",
    publishedAt: "2026-09-01T17:00:00Z",
    symbols: ["DANGCEM", "MTNN", "GTCO", "SEPLAT"],
  },
];
