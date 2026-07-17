import { AhrefsError, domainFromUrl, getPublicDomainRating, resolveToken, tokenLooksWellFormed } from "@/lib/ahrefs";
import type { DomainRatingRequest, ScrapeEvent, SiteResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_DOMAINS = 100;
const CONCURRENCY = 5;

// The free tier only has Domain Rating, so we emit just the base fields — no
// null paid-only fields cluttering the response.
function emptyResult(domain: string, position: number): SiteResult {
  return {
    position,
    url: `https://${domain}`,
    domain,
    domainRating: null,
    enrichError: null,
  };
}

export async function POST(req: Request) {
  let body: DomainRatingRequest;
  try {
    body = (await req.json()) as DomainRatingRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400 });
  }

  const token = resolveToken(body.token);
  const domains = Array.from(
    new Set(
      (body.domains ?? "")
        .split(/[\s,]+/)
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => domainFromUrl(d)),
    ),
  ).slice(0, MAX_DOMAINS);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: ScrapeEvent) => {
        if (!closed) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      try {
        if (!token) {
          send({ type: "error", message: "No Ahrefs API token. Add AHREFS_API_TOKEN to .env.local or paste one in the UI." });
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
        if (domains.length === 0) {
          send({ type: "error", message: "Enter at least one domain (one per line or comma-separated)." });
          return close();
        }

        send({
          type: "status",
          level: "info",
          message: `Looking up Domain Rating for ${domains.length} domain(s) via the free public API…`,
        });
        send({ type: "meta", total: domains.length, keyword: "(domain lookup)", country: "-" });

        const results: SiteResult[] = [];
        let done = 0;
        let warnedDeprecation = false;
        const queue = domains.map((d, i) => ({ d, i }));

        const worker = async () => {
          for (;;) {
            const item = queue.shift();
            if (!item) return;
            const result = emptyResult(item.d, item.i + 1);
            try {
              const dr = await getPublicDomainRating(item.d, token);
              result.domainRating = dr.domain_rating?.domain_rating ?? null;
              const warning = dr.domain_rating?.warning;
              if (warning && !warnedDeprecation) {
                warnedDeprecation = true;
                send({ type: "status", level: "warning", message: `Ahrefs notice: ${warning}` });
              }
            } catch (err) {
              const msg = err instanceof AhrefsError ? err.message : (err as Error).message;
              result.enrichError = msg;
              send({ type: "status", level: "warning", message: `${item.d}: ${msg}` });
            }
            results.push(result);
            done += 1;
            send({ type: "site", data: result });
            send({
              type: "status",
              level: "info",
              message: `Processed ${done}/${domains.length}: ${item.d}${
                result.domainRating != null ? ` (DR ${result.domainRating})` : ""
              }`,
            });
          }
        };

        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, domains.length) }, () => worker()));

        results.sort((a, b) => a.position - b.position);
        send({ type: "status", level: "success", message: `Done. Retrieved Domain Rating for ${results.length} domain(s).` });
        send({ type: "done", results });
        close();
      } catch (err) {
        const message = err instanceof AhrefsError ? err.message : `Unexpected error: ${(err as Error).message}`;
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
