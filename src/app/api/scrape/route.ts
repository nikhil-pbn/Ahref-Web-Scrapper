import {
  AhrefsError,
  domainFromUrl,
  getBacklinksStats,
  getMetricsByCountry,
  getSerpOverview,
  getSiteMetrics,
  resolveToken,
  today,
  tokenLooksWellFormed,
  type CountryMetric,
} from "@/lib/ahrefs";
import type { ScrapeEvent, ScrapeRequest, SiteResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_COUNT = 50;
const ENRICH_CONCURRENCY = 4;

function centsToUsd(v: number | null | undefined): number | null {
  return v === null || v === undefined ? null : Math.round(v) / 100;
}

export async function POST(req: Request) {
  let body: ScrapeRequest;
  try {
    body = (await req.json()) as ScrapeRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400 });
  }

  const keyword = (body.keyword ?? "").trim();
  const country = (body.country ?? "us").trim().toLowerCase();
  const count = Math.min(Math.max(Number(body.count) || 10, 1), MAX_COUNT);
  const filterInDomain = Boolean(body.filterInDomain);
  const token = resolveToken(body.token);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: ScrapeEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      const close = () => {
        if (closed) return;
        closed = true;
        controller.close();
      };

      try {
        if (!token) {
          send({
            type: "error",
            message: "No Ahrefs API token. Add AHREFS_API_TOKEN to .env.local or paste one in the UI.",
          });
          return close();
        }
        if (!tokenLooksWellFormed(token)) {
          send({
            type: "error",
            message:
              "That doesn't look like an Ahrefs API key (expected a long ~40-character token). Paste the full key from Ahrefs → Account settings → API keys.",
          });
          return close();
        }
        if (!keyword) {
          send({ type: "error", message: "Please enter a keyword." });
          return close();
        }

        const date = today();

        // 1) Discover ranking sites via SERP Overview.
        send({
          type: "status",
          level: "info",
          message: `Searching SERP for "${keyword}" in ${country.toUpperCase()} (top ${count})…`,
        });

        const serp = await getSerpOverview(
          { keyword, country, topPositions: count },
          token,
        );

        let positions = (serp.positions ?? [])
          .filter((p) => Array.isArray(p.type) && p.type.includes("organic") && p.url)
          .slice();

        // Dedupe by URL, keep best (lowest) position.
        const seen = new Set<string>();
        positions = positions
          .sort((a, b) => a.position - b.position)
          .filter((p) => {
            const u = p.url as string;
            if (seen.has(u)) return false;
            seen.add(u);
            return true;
          });

        send({
          type: "status",
          level: "info",
          message: `SERP returned ${positions.length} organic result(s).`,
        });

        // 2) Optional filter: keyword must appear in the domain or URL.
        if (filterInDomain) {
          const needle = keyword.toLowerCase().replace(/\s+/g, "");
          const before = positions.length;
          positions = positions.filter((p) => {
            const u = (p.url ?? "").toLowerCase().replace(/\s+/g, "");
            return u.includes(needle);
          });
          send({
            type: "status",
            level: positions.length ? "info" : "warning",
            message: `Filter "keyword in domain/URL" kept ${positions.length} of ${before} result(s).`,
          });
        }

        positions = positions.slice(0, count);

        if (positions.length === 0) {
          send({
            type: "status",
            level: "warning",
            message: "No websites matched. Try a different keyword, country, or turn the filter off.",
          });
          send({ type: "done", results: [] });
          return close();
        }

        send({ type: "meta", total: positions.length, keyword, country });
        send({
          type: "status",
          level: "success",
          message: `Enriching ${positions.length} site(s) with Ahrefs metrics…`,
        });

        // 3) Enrich each result. Cache domain-level lookups so duplicate domains
        //    don't burn extra API units.
        const domainCache = new Map<
          string,
          Promise<{
            orgTraffic: number | null;
            orgKeywords: number | null;
            orgKeywordsTop3: number | null;
            trafficValueUsd: number | null;
            backlinks: number | null;
            refdomains: number | null;
            topCountry: string | null;
            topCountryTraffic: number | null;
          }>
        >();

        const enrichDomain = (domain: string) => {
          const cached = domainCache.get(domain);
          if (cached) return cached;
          const p = (async () => {
            const [metrics, backlinks, byCountry] = await Promise.all([
              getSiteMetrics(domain, date, token),
              getBacklinksStats(domain, date, token),
              getMetricsByCountry(domain, date, token),
            ]);
            const countries = (byCountry.metrics ?? []) as CountryMetric[];
            const top = countries
              .slice()
              .sort((a, b) => (b.org_traffic ?? 0) - (a.org_traffic ?? 0))[0];
            return {
              orgTraffic: metrics.metrics?.org_traffic ?? null,
              orgKeywords: metrics.metrics?.org_keywords ?? null,
              orgKeywordsTop3: metrics.metrics?.org_keywords_1_3 ?? null,
              trafficValueUsd: centsToUsd(metrics.metrics?.org_cost),
              backlinks: backlinks.metrics?.live ?? null,
              refdomains: backlinks.metrics?.live_refdomains ?? null,
              topCountry: top?.country ?? null,
              topCountryTraffic: top?.org_traffic ?? null,
            };
          })();
          domainCache.set(domain, p);
          return p;
        };

        const results: SiteResult[] = [];
        let doneCount = 0;

        const buildResult = async (pos: (typeof positions)[number], rank: number): Promise<SiteResult> => {
          const url = pos.url as string;
          const domain = domainFromUrl(url);
          const base: SiteResult = {
            position: rank,
            url,
            domain,
            title: pos.title ?? null,
            domainRating: pos.domain_rating ?? null,
            urlRating: pos.url_rating ?? null,
            backlinks: pos.backlinks ?? null,
            refdomains: pos.refdomains ?? null,
            keywords: pos.keywords ?? null,
            traffic: pos.traffic ?? null,
            trafficValueUsd: centsToUsd(pos.value),
            topKeyword: pos.top_keyword ?? null,
            topKeywordVolume: pos.top_keyword_volume ?? null,
            domainOrgTraffic: null,
            domainOrgKeywords: null,
            domainOrgKeywordsTop3: null,
            domainTrafficValueUsd: null,
            domainBacklinks: null,
            domainRefdomains: null,
            topCountry: null,
            topCountryTraffic: null,
            enrichError: null,
          };
          try {
            const e = await enrichDomain(domain);
            base.domainOrgTraffic = e.orgTraffic;
            base.domainOrgKeywords = e.orgKeywords;
            base.domainOrgKeywordsTop3 = e.orgKeywordsTop3;
            base.domainTrafficValueUsd = e.trafficValueUsd;
            base.domainBacklinks = e.backlinks;
            base.domainRefdomains = e.refdomains;
            base.topCountry = e.topCountry;
            base.topCountryTraffic = e.topCountryTraffic;
          } catch (err) {
            const msg = err instanceof AhrefsError ? err.message : (err as Error).message;
            base.enrichError = msg;
            send({
              type: "status",
              level: "warning",
              message: `Could not fully enrich ${domain}: ${msg}`,
            });
          }
          return base;
        };

        // Simple worker pool for enrichment. Assign a sequential 1-based rank
        // up front (SERP positions have gaps from ads/features) so the "#"
        // column reads 1, 2, 3, … regardless of raw SERP position.
        const queue = positions.map((pos, i) => ({ pos, rank: i + 1 }));
        const worker = async () => {
          for (;;) {
            const item = queue.shift();
            if (!item) return;
            const result = await buildResult(item.pos, item.rank);
            results.push(result);
            doneCount += 1;
            send({ type: "site", data: result });
            send({
              type: "status",
              level: "info",
              message: `Processed ${doneCount}/${positions.length}: ${result.domain}`,
            });
          }
        };

        await Promise.all(
          Array.from({ length: Math.min(ENRICH_CONCURRENCY, positions.length) }, () => worker()),
        );

        results.sort((a, b) => a.position - b.position);
        send({ type: "status", level: "success", message: `Done. Collected ${results.length} site(s).` });
        send({ type: "done", results });
        close();
      } catch (err) {
        const message =
          err instanceof AhrefsError ? err.message : `Unexpected error: ${(err as Error).message}`;
        send({ type: "error", message });
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
