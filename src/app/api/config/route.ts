import { NextResponse } from "next/server";
import { detectTier } from "@/lib/ahrefs";

export const runtime = "nodejs";

// Tells the UI whether a token is configured server-side (.env) and what it can
// do (full API / free public tier / invalid) — without ever exposing the token.
export async function GET() {
  const token = (process.env.AHREFS_API_TOKEN ?? "").trim();
  const envTokenPresent = Boolean(token);
  const tier = token ? await detectTier(token) : "none";
  return NextResponse.json({ envTokenPresent, tier });
}
