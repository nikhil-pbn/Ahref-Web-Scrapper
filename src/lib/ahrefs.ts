// Server-side Ahrefs API v3 client.
// The API token is a Bearer token from your Ahrefs account (Account settings -> API).
// It is only ever read/used on the server; it is never sent to the browser.

const AHREFS_BASE = "https://api.ahrefs.com/v3";

export class AhrefsError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string, message?: string) {
    super(message ?? `Ahrefs API error ${status}`);
    this.name = "AhrefsError";
    this.status = status;
    this.body = body;
  }
}

type QueryValue = string | number | boolean | undefined | null;

async function ahrefsGet<T>(
  path: string,
  params: Record<string, QueryValue>,
  token: string,
): Promise<T> {
  const url = new URL(`${AHREFS_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new AhrefsError(0, "", `Network error contacting Ahrefs: ${(err as Error).message}`);
  }

  const text = await res.text();
  if (!res.ok) {
    // Surface the real Ahrefs message so the UI can show a useful error.
    let message = `Ahrefs API error ${res.status}`;
    try {
      const parsed = JSON.parse(text) as { error?: string; message?: string };
      if (parsed.error || parsed.message) message = parsed.error ?? parsed.message ?? message;
    } catch {
      if (text) message = `${message}: ${text.slice(0, 300)}`;
    }

    // Ahrefs often returns an empty body on auth failures — add actionable hints
    // and name the endpoint so the user knows exactly what their plan is missing.
    if (res.status === 401) {
      message = `401 Unauthorized on ${path} — Ahrefs rejected the API token. Check that it's a valid, non-expired Ahrefs API v3 token with API access enabled (the API is a separate paid add-on).`;
    } else if (res.status === 403) {
      message = `403 Forbidden on ${path} — your Ahrefs plan doesn't permit this endpoint. SERP Overview and Site Explorer are sold as separate API access levels, so a token can work for one and not the other. Check that your API subscription includes ${path}.`;
    } else if (res.status === 429) {
      message = `429 Too Many Requests on ${path} — Ahrefs rate limit or API units exhausted. Slow down or check your remaining units.`;
    }
    throw new AhrefsError(res.status, text, message);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AhrefsError(res.status, text, "Ahrefs returned a non-JSON response.");
  }
}

/** A YYYY-MM-DD date usable for the metrics endpoints (they return the latest data <= this date). */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Endpoint wrappers
// ---------------------------------------------------------------------------

export type SubscriptionInfo = {
  limits_and_usage?: {
    subscription?: string;
    usage_limit_api_units?: number;
    used_api_units?: number;
    api_units_limit_workspace?: number;
    api_units_usage_workspace?: number;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export function getSubscriptionInfo(token: string) {
  return ahrefsGet<SubscriptionInfo>("/subscription-info/limits-and-usage", {}, token);
}

export type ApiTier = "full" | "public" | "none";

/**
 * Detect what a token can do.
 * - "full": the paid API responded (subscription-info) — a verified full-API key.
 * - "public": the paid API rejected it, so only free public-tier features apply.
 *
 * Note: we can't verify a non-full token's validity, because Ahrefs' public
 * endpoints are currently unauthenticated (they accept any/no token). So "public"
 * means "full API unavailable", not "token confirmed valid".
 */
export async function detectTier(token: string): Promise<ApiTier> {
  if (!token) return "none";
  try {
    await getSubscriptionInfo(token);
    return "full";
  } catch {
    return "public";
  }
}

export type PublicDomainRating = {
  domain_rating: { domain_rating: number | null; warning?: string | null };
};

/** Free public endpoint: Domain Rating for a single domain/URL. */
export async function getPublicDomainRating(target: string, token: string) {
  return ahrefsGet<PublicDomainRating>(
    "/public/domain-rating-free",
    { target, output: "json" },
    token,
  );
}

export type SerpPosition = {
  position: number;
  type: string[];
  url: string | null;
  title: string | null;
  domain_rating: number | null;
  url_rating: number | null;
  backlinks: number | null;
  refdomains: number | null;
  keywords: number | null;
  traffic: number | null;
  value: number | null;
  top_keyword: string | null;
  top_keyword_volume: number | null;
};

const SERP_SELECT = [
  "position",
  "type",
  "url",
  "title",
  "domain_rating",
  "url_rating",
  "backlinks",
  "refdomains",
  "keywords",
  "traffic",
  "value",
  "top_keyword",
  "top_keyword_volume",
].join(",");

export function getSerpOverview(
  args: { keyword: string; country: string; topPositions: number },
  token: string,
) {
  return ahrefsGet<{ positions: SerpPosition[] }>(
    "/serp-overview/serp-overview",
    {
      keyword: args.keyword,
      country: args.country,
      select: SERP_SELECT,
      top_positions: args.topPositions,
      output: "json",
    },
    token,
  );
}

export type SiteMetrics = {
  metrics: {
    org_traffic: number | null;
    org_keywords: number | null;
    org_keywords_1_3: number | null;
    org_cost: number | null;
  };
};

export function getSiteMetrics(target: string, date: string, token: string) {
  return ahrefsGet<SiteMetrics>(
    "/site-explorer/metrics",
    { target, date, mode: "subdomains", protocol: "both", volume_mode: "monthly", output: "json" },
    token,
  );
}

export type BacklinksStats = {
  metrics: {
    live: number | null;
    live_refdomains: number | null;
    all_time: number | null;
    all_time_refdomains: number | null;
  };
};

export function getBacklinksStats(target: string, date: string, token: string) {
  return ahrefsGet<BacklinksStats>(
    "/site-explorer/backlinks-stats",
    { target, date, mode: "subdomains", protocol: "both", output: "json" },
    token,
  );
}

export type CountryMetric = {
  country: string;
  org_traffic: number | null;
  org_keywords: number | null;
};

export function getMetricsByCountry(target: string, date: string, token: string) {
  return ahrefsGet<{ metrics: CountryMetric[] }>(
    "/site-explorer/metrics-by-country",
    {
      target,
      date,
      mode: "subdomains",
      protocol: "both",
      volume_mode: "monthly",
      select: "country,org_traffic,org_keywords",
      output: "json",
    },
    token,
  );
}

/** Resolve the effective token: UI override first, then server .env. */
export function resolveToken(override?: string): string {
  const t = (override && override.trim()) || (process.env.AHREFS_API_TOKEN ?? "").trim();
  return t;
}

/**
 * A cheap format sanity check. Ahrefs does NOT validate free-tier tokens at all
 * (any non-empty string is accepted by the public endpoints), so this is the
 * only guard we have against obvious garbage like "abndefghi". Real Ahrefs API
 * keys are long alphanumeric strings (the sample key is 40 chars).
 */
export function tokenLooksWellFormed(t: string): boolean {
  return /^[A-Za-z0-9_-]{20,}$/.test(t.trim());
}

/** Extract a clean registrable-ish domain from a URL. */
export function domainFromUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "");
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}
