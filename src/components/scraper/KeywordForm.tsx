"use client";

import { useScraper } from "@/context/ScraperContext";
import { COUNTRIES } from "@/lib/constants";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { StatusMessage } from "@/components/ui/StatusMessage";

export function KeywordForm() {
  const {
    tier,
    keyword,
    setKeyword,
    country,
    setCountry,
    count,
    setCount,
    filterInDomain,
    setFilterInDomain,
    running,
    run,
  } = useScraper();

  return (
    <>
      {tier === "public" && (
        <StatusMessage level="warning" className="mb-4">
          Your token is on the free public tier, which doesn&apos;t include keyword search. This will return an error
          until you enable the paid Ahrefs API add-on. Use <b>Domain lookup</b> for data you can get now.
        </StatusMessage>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 lg:col-span-2">
          <span className="text-sm font-medium opacity-70">Keyword</span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. dentist"
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/15"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium opacity-70">Country</span>
          <Select ariaLabel="Country" value={country} onChange={setCountry} options={COUNTRIES} />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium opacity-70">How many websites (1–50)</span>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/15"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filterInDomain}
            onChange={(e) => setFilterInDomain(e.target.checked)}
            className="h-4 w-4 accent-blue-500"
          />
          <span>Only keep results where the keyword appears in the domain/URL</span>
        </label>
        <button
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {running && <Spinner />}
          {running ? "Fetching…" : "Get data"}
        </button>
      </div>
    </>
  );
}
