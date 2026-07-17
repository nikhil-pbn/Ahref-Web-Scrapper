"use client";

import { useScraper } from "@/context/ScraperContext";
import { Spinner } from "@/components/ui/Spinner";
import { StatusMessage } from "@/components/ui/StatusMessage";

export function DomainForm() {
  const { domainsText, setDomainsText, running, run } = useScraper();

  return (
    <>
      <StatusMessage level="info" className="mb-4">
        Free public tier: paste domains (one per line or comma-separated) to fetch each one&apos;s <b>Domain Rating</b>.
        This works on any valid Ahrefs token — no paid add-on needed.
      </StatusMessage>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium opacity-70">Domains</span>
        <textarea
          value={domainsText}
          onChange={(e) => setDomainsText(e.target.value)}
          rows={6}
          placeholder={"ahrefs.com\nexample.com\nnytimes.com"}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 dark:border-white/15"
        />
      </label>

      <div className="mt-4 flex justify-end">
        <button
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {running && <Spinner />}
          {running ? "Fetching…" : "Get Domain Rating"}
        </button>
      </div>
    </>
  );
}
