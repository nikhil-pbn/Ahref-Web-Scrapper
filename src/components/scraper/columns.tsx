import { num, usd } from "@/lib/format";
import type { Column, Mode, SiteResult } from "@/lib/types";

function DomainCell(r: SiteResult) {
  return (
    <>
      <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-blue-400 hover:underline">
        {r.domain}
      </a>
      {r.title && <div className="max-w-xs truncate opacity-60">{r.title}</div>}
      {r.enrichError && <div className="text-amber-400">⚠ {r.enrichError}</div>}
    </>
  );
}

/** Build the sortable column set for the given result mode. */
export function buildColumns(mode: Mode): Column[] {
  if (mode === "domains") {
    return [
      { key: "position", label: "#", cell: (r) => <span className="opacity-60">{r.position}</span> },
      { key: "domain", label: "Domain", cell: DomainCell },
      {
        key: "domainRating",
        label: "Domain Rating",
        align: "right",
        cell: (r) => <span className="font-semibold">{num(r.domainRating)}</span>,
      },
    ];
  }
  return [
    { key: "position", label: "#", cell: (r) => <span className="opacity-60">{r.position}</span> },
    { key: "domain", label: "Website / Page", cell: DomainCell },
    { key: "domainRating", label: "DR", align: "right", cell: (r) => num(r.domainRating) },
    { key: "urlRating", label: "UR", align: "right", cell: (r) => num(r.urlRating) },
    { key: "backlinks", label: "Backlinks", align: "right", cell: (r) => num(r.backlinks) },
    { key: "refdomains", label: "Ref. domains", align: "right", cell: (r) => num(r.refdomains) },
    { key: "keywords", label: "Keywords", align: "right", cell: (r) => num(r.keywords) },
    { key: "traffic", label: "Page traffic", align: "right", cell: (r) => num(r.traffic) },
    { key: "domainOrgTraffic", label: "Domain traffic", align: "right", cell: (r) => num(r.domainOrgTraffic) },
    {
      key: "domainTrafficValueUsd",
      label: "Domain value",
      align: "right",
      cell: (r) => usd(r.domainTrafficValueUsd),
    },
    {
      key: "topCountry",
      label: "Top country",
      cell: (r) => (r.topCountry ? `${r.topCountry.toUpperCase()} (${num(r.topCountryTraffic)})` : "—"),
    },
  ];
}
