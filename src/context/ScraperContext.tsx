"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ConnMessage,
  DownloadFormat,
  LogEntry,
  Mode,
  Progress,
  ScrapeEvent,
  SiteResult,
  SortDir,
  SortKey,
  StatusLevel,
  Tier,
} from "@/lib/types";
import { downloadResults } from "@/lib/export";

type ScraperContextValue = {
  // Connection
  envTokenPresent: boolean | null;
  tier: Tier;
  loading: boolean;
  token: string;
  setToken: (v: string) => void;
  showOverride: boolean;
  setShowOverride: (v: boolean) => void;
  testing: boolean;
  connMsg: ConnMessage | null;
  testConnection: () => Promise<void>;
  keywordLocked: boolean;

  // Mode + forms
  mode: Mode;
  effectiveMode: Mode;
  setMode: (m: Mode) => void;
  keyword: string;
  setKeyword: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  filterInDomain: boolean;
  setFilterInDomain: (v: boolean) => void;
  domainsText: string;
  setDomainsText: (v: string) => void;

  // Run + results
  running: boolean;
  log: LogEntry[];
  results: SiteResult[];
  resultMode: Mode;
  progress: Progress | null;
  run: () => Promise<void>;

  // Sort
  sortKey: SortKey;
  sortDir: SortDir;
  toggleSort: (key: SortKey) => void;
  sortedResults: SiteResult[];

  // Export
  format: DownloadFormat;
  setFormat: (f: DownloadFormat) => void;
  download: () => void;
};

const ScraperContext = createContext<ScraperContextValue | null>(null);

export function useScraper(): ScraperContextValue {
  const ctx = useContext(ScraperContext);
  if (!ctx) throw new Error("useScraper must be used within <ScraperProvider>");
  return ctx;
}

export function ScraperProvider({ children }: { children: ReactNode }) {
  // Connection
  const [envTokenPresent, setEnvTokenPresent] = useState<boolean | null>(null);
  const [tier, setTier] = useState<Tier>(null);
  const [token, setToken] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connMsg, setConnMsg] = useState<ConnMessage | null>(null);

  // Mode + forms
  const [mode, setMode] = useState<Mode>("keyword");
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("us");
  const [count, setCount] = useState(10);
  const [filterInDomain, setFilterInDomain] = useState(false);
  const [domainsText, setDomainsText] = useState("");

  // Run state
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<SiteResult[]>([]);
  const [resultMode, setResultMode] = useState<Mode>("keyword");
  const [format, setFormat] = useState<DownloadFormat>("excel");
  const [sortKey, setSortKey] = useState<SortKey>("position");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [progress, setProgress] = useState<Progress | null>(null);

  // Only send a token from the browser when the override box is in use. With a
  // token in .env this stays undefined so the token never hits the network.
  const overrideActive = showOverride || envTokenPresent === false;
  const bodyToken = overrideActive && token.trim() ? token.trim() : undefined;

  const loading = envTokenPresent === null;
  const keywordLocked = tier === "public";
  const effectiveMode: Mode = keywordLocked ? "domains" : mode;

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setEnvTokenPresent(Boolean(d.envTokenPresent));
        setTier((d.tier as Tier) ?? null);
        if (d.tier === "public") setMode("domains");
      })
      .catch(() => {
        setEnvTokenPresent(false);
        setTier("none");
      });
  }, []);

  const addLog = (level: StatusLevel, message: string) =>
    setLog((prev) => [...prev, { level, message, ts: Date.now() }]);

  async function testConnection() {
    setTesting(true);
    setConnMsg(null);
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: bodyToken }),
      });
      const data = await res.json();
      if (data.tier) {
        setTier(data.tier as Tier);
        if (data.tier === "public") setMode("domains");
        if (data.tier === "full") setMode("keyword");
      }
      if (data.ok) {
        const parts = [data.message];
        if (data.subscription) parts.push(`Plan: ${data.subscription}`);
        if (data.unitsUsed != null && data.unitsLimit != null)
          parts.push(`Units: ${Number(data.unitsUsed).toLocaleString()} / ${Number(data.unitsLimit).toLocaleString()}`);
        setConnMsg({ level: (data.level as StatusLevel) ?? "success", text: parts.join("  •  ") });
      } else {
        setConnMsg({ level: (data.level as StatusLevel) ?? "error", text: data.message ?? "Connection failed." });
      }
    } catch (err) {
      setConnMsg({ level: "error", text: `Connection failed: ${(err as Error).message}` });
    } finally {
      setTesting(false);
    }
  }

  function handleEvent(event: ScrapeEvent) {
    switch (event.type) {
      case "status":
        addLog(event.level, event.message);
        break;
      case "meta":
        setProgress({ done: 0, total: event.total });
        break;
      case "site":
        setResults((prev) => [...prev, event.data].sort((a, b) => a.position - b.position));
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
        break;
      case "done":
        if (event.results.length) setResults(event.results);
        break;
      case "error":
        addLog("error", event.message);
        break;
    }
  }

  async function run() {
    if (running) return;
    if (!envTokenPresent && !bodyToken) {
      addLog("error", "Enter your Ahrefs API token above and click Test connection first.");
      return;
    }
    if (effectiveMode === "keyword" && !keyword.trim()) {
      addLog("error", "Please enter a keyword first.");
      return;
    }
    if (effectiveMode === "domains" && !domainsText.trim()) {
      addLog("error", "Please enter at least one domain.");
      return;
    }

    setRunning(true);
    setLog([]);
    setResults([]);
    setProgress(null);
    setResultMode(effectiveMode);
    setSortKey("position");
    setSortDir("asc");

    const endpoint = effectiveMode === "keyword" ? "/api/scrape" : "/api/domain-rating";
    const payload =
      effectiveMode === "keyword"
        ? { keyword: keyword.trim(), country, count, filterInDomain, token: bodyToken }
        : { domains: domainsText, token: bodyToken };

    addLog(
      "info",
      effectiveMode === "keyword"
        ? `Keyword search: "${keyword.trim()}" in ${country.toUpperCase()}, up to ${count} site(s).`
        : "Domain Rating lookup (free public tier).",
    );

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        addLog("error", `Request failed (${res.status}). ${text.slice(0, 200)}`);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            handleEvent(JSON.parse(line) as ScrapeEvent);
          } catch {
            // ignore malformed line fragments
          }
        }
      }
    } catch (err) {
      addLog("error", `Stream error: ${(err as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const aEmpty = av === null || av === undefined || av === "";
      const bEmpty = bv === null || bv === undefined || bv === "";
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1; // blanks always sort to the bottom
      if (bEmpty) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [results, sortKey, sortDir]);

  function download() {
    void downloadResults(format, results, { mode: resultMode, keyword, country });
  }

  const value: ScraperContextValue = {
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
    keywordLocked,
    mode,
    effectiveMode,
    setMode,
    keyword,
    setKeyword,
    country,
    setCountry,
    count,
    setCount,
    filterInDomain,
    setFilterInDomain,
    domainsText,
    setDomainsText,
    running,
    log,
    results,
    resultMode,
    progress,
    run,
    sortKey,
    sortDir,
    toggleSort,
    sortedResults,
    format,
    setFormat,
    download,
  };

  return <ScraperContext.Provider value={value}>{children}</ScraperContext.Provider>;
}
