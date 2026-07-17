"use client";

import { useScraper } from "@/context/ScraperContext";
import { LEVEL_STYLES } from "@/lib/constants";
import type { Tier } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/StatusMessage";

function tierBadge(tier: Tier): { text: string; cls: string } {
  switch (tier) {
    case null:
      return { text: "checking…", cls: "border-black/10 opacity-60 dark:border-white/10" };
    case "full":
      return { text: "Full API — all features", cls: LEVEL_STYLES.success };
    case "public":
      return { text: "Free public tier — Domain Rating only", cls: LEVEL_STYLES.warning };
    case "invalid":
      return { text: "Token invalid", cls: LEVEL_STYLES.error };
    default:
      return { text: "No token", cls: LEVEL_STYLES.warning };
  }
}

export function ConnectionPanel() {
  const {
    envTokenPresent,
    tier,
    loading,
    token,
    setToken,
    showOverride,
    setShowOverride,
    testing,
    connMsg,
    testConnection,
  } = useScraper();

  const badge = tierBadge(tier);
  const testButton = (
    <button
      onClick={testConnection}
      disabled={testing}
      className="shrink-0 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
    >
      {testing ? "Testing…" : "Test connection"}
    </button>
  );

  return (
    <Card className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Ahrefs connection</h2>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${badge.cls}`}>{badge.text}</span>
      </div>

      {loading ? (
        <div className="h-10 w-full animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
      ) : envTokenPresent && !showOverride ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm opacity-80">
            🔒 Using the token from <code className="font-mono">.env.local</code> — read on the server only, never sent
            from your browser.
          </p>
          {testButton}
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={envTokenPresent ? "Enter a different token to use instead of .env" : "Paste your Ahrefs API token"}
            className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/15"
            autoComplete="off"
          />
          {testButton}
        </div>
      )}

      {connMsg && (
        <StatusMessage level={connMsg.level} className="mt-3">
          {connMsg.text}
        </StatusMessage>
      )}

      {!loading && (
        <p className="mt-2 text-sm opacity-50">
          {envTokenPresent ? (
            showOverride ? (
              <>
                A token typed here is sent to the server for this session (it will appear in the Network tab).{" "}
                <button
                  onClick={() => {
                    setShowOverride(false);
                    setToken("");
                  }}
                  className="underline hover:opacity-100"
                >
                  Use the .env token instead
                </button>
              </>
            ) : (
              <>
                Prefer <code className="font-mono">.env.local</code>. Only if you need a one-off key,{" "}
                <button onClick={() => setShowOverride(true)} className="underline hover:opacity-100">
                  use a different token
                </button>
                .
              </>
            )
          ) : (
            <>
              The token is sent to the server for this session and used only there. To avoid sending it over the network,
              set <code className="font-mono">AHREFS_API_TOKEN</code> in <code className="font-mono">.env.local</code>.
            </>
          )}
        </p>
      )}
    </Card>
  );
}
