"use client";

import { useScraper } from "@/context/ScraperContext";

export function ModeTabs() {
  const { effectiveMode, setMode, keywordLocked } = useScraper();

  const tabClass = (active: boolean, locked = false) =>
    `flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-center font-medium transition sm:flex-none sm:px-4 ${
      locked
        ? "cursor-not-allowed opacity-40"
        : active
          ? "bg-blue-600 text-white"
          : "opacity-70 hover:opacity-100"
    }`;

  return (
    <>
      <div className="mb-1 flex w-full gap-1 rounded-lg border border-black/10 p-1 text-sm sm:inline-flex sm:w-auto dark:border-white/10">
        <button
          onClick={() => !keywordLocked && setMode("keyword")}
          disabled={keywordLocked}
          title={keywordLocked ? "Requires the paid Ahrefs API. Your token can't access keyword search." : undefined}
          className={tabClass(effectiveMode === "keyword", keywordLocked)}
        >
          {keywordLocked ? "🔒 " : ""}Keyword search
          <span className="ml-1.5 hidden text-[10px] opacity-70 sm:inline">(paid API)</span>
        </button>
        <button onClick={() => setMode("domains")} className={tabClass(effectiveMode === "domains")}>
          Domain lookup
          <span className="ml-1.5 hidden text-[10px] opacity-70 sm:inline">(free tier)</span>
        </button>
      </div>
      {keywordLocked ? (
        <p className="mb-4 mt-1.5 text-sm opacity-60">
          Keyword search is locked — your token only has free public-tier access. Enable the paid Ahrefs API to unlock it.
        </p>
      ) : (
        <div className="mb-4" />
      )}
    </>
  );
}
