import type { DownloadFormat, Mode, SiteResult } from "./types";

export type ExportMeta = { mode: Mode; keyword: string; country: string };

function fileBase(meta: ExportMeta): string {
  const label = meta.mode === "keyword" ? meta.keyword.trim() || "results" : "domain-ratings";
  return `ahrefs-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

function docTitle(meta: ExportMeta): string {
  return meta.mode === "keyword"
    ? `Ahrefs keyword results: ${meta.keyword.trim() || "results"} (${meta.country.toUpperCase()})`
    : "Ahrefs Domain Rating";
}

/** Column headers + rows shared by CSV/Word/Excel, matching the on-screen table. */
export function buildTable(results: SiteResult[], mode: Mode): {
  headers: string[];
  rows: (string | number)[][];
} {
  if (mode === "domains") {
    return {
      headers: ["#", "Domain", "URL", "Domain Rating"],
      rows: results.map((r) => [r.position, r.domain, r.url, r.domainRating ?? ""]),
    };
  }
  return {
    headers: [
      "#", "Domain", "URL", "Title", "DR", "UR", "Backlinks", "Ref. domains",
      "Keywords", "Page traffic", "Domain traffic", "Domain value (USD)", "Top country",
    ],
    rows: results.map((r) => [
      r.position, r.domain, r.url, r.title ?? "", r.domainRating ?? "", r.urlRating ?? "",
      r.backlinks ?? "", r.refdomains ?? "", r.keywords ?? "", r.traffic ?? "",
      r.domainOrgTraffic ?? "", r.domainTrafficValueUsd ?? "",
      r.topCountry ? r.topCountry.toUpperCase() : "",
    ]),
  };
}

function triggerDownload(content: BlobPart, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportJson(results: SiteResult[], meta: ExportMeta) {
  const payload = {
    mode: meta.mode,
    keyword: meta.mode === "keyword" ? meta.keyword.trim() : undefined,
    country: meta.mode === "keyword" ? meta.country : undefined,
    generatedAt: new Date().toISOString(),
    total: results.length,
    results,
  };
  triggerDownload(JSON.stringify(payload, null, 2), "application/json", `${fileBase(meta)}.json`);
}

function exportCsv(results: SiteResult[], meta: ExportMeta) {
  const { headers, rows } = buildTable(results, meta.mode);
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((row) => row.map(esc).join(",")).join("\r\n");
  // BOM so Excel/Sheets read UTF-8 correctly.
  triggerDownload("﻿" + csv, "text/csv;charset=utf-8", `${fileBase(meta)}.csv`);
}

async function exportExcel(results: SiteResult[], meta: ExportMeta) {
  const XLSX = await import("xlsx");
  const { headers, rows } = buildTable(results, meta.mode);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(10, Math.min(45, h.length + 4)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, meta.mode === "domains" ? "Domain Rating" : "Keyword results");
  XLSX.writeFile(wb, `${fileBase(meta)}.xlsx`);
}

function exportWord(results: SiteResult[], meta: ExportMeta) {
  const { headers, rows } = buildTable(results, meta.mode);
  const esc = (v: string | number) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const thead = `<tr>${headers
    .map((h) => `<th style="background:#f0f0f0;border:1px solid #999;padding:6px;text-align:left">${esc(h)}</th>`)
    .join("")}</tr>`;
  const tbody = rows
    .map((row) => `<tr>${row.map((c) => `<td style="border:1px solid #ccc;padding:6px">${esc(c)}</td>`).join("")}</tr>`)
    .join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(docTitle(meta))}</title></head><body style="font-family:Calibri,Arial,sans-serif">
<h2>${esc(docTitle(meta))}</h2>
<p style="color:#666;font-size:12px">Generated ${new Date().toLocaleString()} · ${results.length} result(s)</p>
<table style="border-collapse:collapse;font-size:12px">${thead}${tbody}</table>
</body></html>`;
  triggerDownload(html, "application/msword", `${fileBase(meta)}.doc`);
}

/** Download the current results in the chosen format. */
export async function downloadResults(
  format: DownloadFormat,
  results: SiteResult[],
  meta: ExportMeta,
): Promise<void> {
  switch (format) {
    case "excel":
      return exportExcel(results, meta);
    case "word":
      return exportWord(results, meta);
    case "csv":
      return exportCsv(results, meta);
    default:
      return exportJson(results, meta);
  }
}
