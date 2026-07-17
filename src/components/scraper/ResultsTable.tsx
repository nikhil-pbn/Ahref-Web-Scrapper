"use client";

import { useMemo } from "react";
import { useScraper } from "@/context/ScraperContext";
import { DOWNLOAD_FORMATS } from "@/lib/constants";
import type { DownloadFormat } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { buildColumns } from "./columns";

export function ResultsTable() {
  const { results, resultMode, sortedResults, sortKey, sortDir, toggleSort, format, setFormat, download } =
    useScraper();

  const columns = useMemo(() => buildColumns(resultMode), [resultMode]);

  if (results.length === 0) return null;

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Results ({results.length})</h2>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Select
            ariaLabel="Download format"
            className="flex-1 sm:w-40 sm:flex-none"
            value={format}
            onChange={(v) => setFormat(v as DownloadFormat)}
            options={DOWNLOAD_FORMATS}
          />
          <button
            onClick={download}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            ⬇ Download
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm opacity-50">
        Excel & CSV open in Microsoft Excel or Google Sheets. Word opens in Microsoft Word or Google Docs (File → Open →
        Upload).
      </p>

      <div className="overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-[11px] uppercase opacity-60 dark:border-white/10">
              {columns.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th key={c.key} className={`px-2 py-2 ${c.align === "right" ? "text-right" : ""}`}>
                    <button
                      onClick={() => toggleSort(c.key)}
                      title="Click to sort"
                      className={`inline-flex items-center gap-1 uppercase transition hover:opacity-100 ${
                        active ? "font-semibold text-blue-400 opacity-100" : ""
                      } ${c.align === "right" ? "flex-row-reverse" : ""}`}
                    >
                      <span>{c.label}</span>
                      <span className="text-[9px] leading-none">{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((r) => (
              <tr key={`${r.position}-${r.url}`} className="border-b border-black/5 align-top dark:border-white/5">
                {columns.map((c) => (
                  <td key={c.key} className={`px-2 py-2 ${c.align === "right" ? "text-right" : ""}`}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
