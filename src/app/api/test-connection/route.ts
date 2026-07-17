import { NextResponse } from "next/server";
import { AhrefsError, getSubscriptionInfo, resolveToken, tokenLooksWellFormed } from "@/lib/ahrefs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { token?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — fall back to .env
  }

  const token = resolveToken(body.token);
  if (!token) {
    return NextResponse.json(
      { ok: false, level: "error", tier: "none", message: "No Ahrefs API token. Add AHREFS_API_TOKEN to .env.local or paste one above." },
      { status: 400 },
    );
  }
  if (!tokenLooksWellFormed(token)) {
    return NextResponse.json(
      {
        ok: false,
        level: "error",
        tier: "invalid",
        message:
          "That doesn't look like an Ahrefs API key. Expected a long alphanumeric token (~40 characters) — paste the full key from Ahrefs → Account settings → API keys.",
      },
      { status: 400 },
    );
  }

  try {
    const info = await getSubscriptionInfo(token);
    const usage = info.limits_and_usage ?? {};
    return NextResponse.json({
      ok: true,
      level: "success",
      tier: "full",
      message: "Connected to Ahrefs (full API). Keyword search and metrics are available.",
      subscription: usage.subscription ?? null,
      unitsLimit: usage.usage_limit_api_units ?? usage.api_units_limit_workspace ?? null,
      unitsUsed: usage.used_api_units ?? usage.api_units_usage_workspace ?? null,
    });
  } catch (err) {
    // The paid API rejected the token (401/403). Only free public-tier features
    // apply. We can't strictly verify the token here because Ahrefs' public
    // endpoints are currently unauthenticated — so this isn't a validity check.
    if (err instanceof AhrefsError && (err.status === 401 || err.status === 403)) {
      return NextResponse.json({
        ok: true,
        level: "warning",
        tier: "public",
        message:
          "This token can't access the paid Ahrefs API, so only free public-tier data (Domain Rating) is available. ⚠️ Heads up: Ahrefs doesn't validate free-tier tokens — it accepts any string — so this does NOT confirm the token is genuine. Enable the paid API add-on for keyword search + full metrics.",
      });
    }
    // Network / unexpected error — not a verdict on the token, so leave tier unset.
    const message =
      err instanceof AhrefsError ? err.message : `Unexpected error: ${(err as Error).message}`;
    const status = err instanceof AhrefsError && err.status ? err.status : 500;
    return NextResponse.json({ ok: false, level: "error", message }, { status });
  }
}
