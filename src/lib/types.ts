// Shared types between the API routes and the UI.
import type { ReactNode } from "react";

/**
 * One website/page in the results.
 *
 * The base fields are always present. The paid-only fields are optional and are
 * populated ONLY by keyword search (paid API). The free Domain Rating lookup
 * omits them entirely, so its network response stays lean (no null clutter).
 */
export type SiteResult = {
  position: number;
  url: string;
  domain: string;
  domainRating: number | null;
  enrichError: string | null;

  // --- Paid-only (keyword search / Site Explorer); omitted on the free tier ---
  title?: string | null;
  urlRating?: number | null;
  backlinks?: number | null;
  refdomains?: number | null;
  keywords?: number | null;
  traffic?: number | null;
  trafficValueUsd?: number | null;
  topKeyword?: string | null;
  topKeywordVolume?: number | null;
  domainOrgTraffic?: number | null;
  domainOrgKeywords?: number | null;
  domainOrgKeywordsTop3?: number | null;
  domainTrafficValueUsd?: number | null;
  domainBacklinks?: number | null;
  domainRefdomains?: number | null;
  topCountry?: string | null;
  topCountryTraffic?: number | null;
};

export type ScrapeRequest = {
  keyword: string;
  country: string; // ISO 3166-1 alpha-2, lower-case
  count: number;
  filterInDomain: boolean;
  token?: string; // optional UI override; falls back to server .env
};

export type DomainRatingRequest = {
  domains: string; // raw text: one domain per line or comma-separated
  token?: string;
};

export type StatusLevel = "info" | "warning" | "error" | "success";

/** NDJSON events streamed from /api/scrape to the browser. */
export type ScrapeEvent =
  | { type: "status"; level: StatusLevel; message: string }
  | { type: "meta"; total: number; keyword: string; country: string }
  | { type: "site"; data: SiteResult }
  | { type: "done"; results: SiteResult[] }
  | { type: "error"; message: string };

// --- UI-only types --------------------------------------------------------

/** Which tool the user is running. */
export type Mode = "keyword" | "domains";

/** What the active token can do. `null` = not yet detected. */
export type Tier = "full" | "public" | "invalid" | "none" | null;

export type SortKey = keyof SiteResult;
export type SortDir = "asc" | "desc";
export type DownloadFormat = "excel" | "word" | "csv" | "json";

export type LogEntry = { level: StatusLevel; message: string; ts: number };
export type ConnMessage = { level: StatusLevel; text: string };
export type Progress = { done: number; total: number };
export type SelectOption = { value: string; label: string; disabled?: boolean };

/** A sortable results-table column with a custom cell renderer. */
export type Column = {
  key: SortKey;
  label: string;
  align?: "left" | "right";
  cell: (r: SiteResult) => ReactNode;
};
