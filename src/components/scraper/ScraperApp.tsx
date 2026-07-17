"use client";

import { useScraper } from "@/context/ScraperContext";
import { Card } from "@/components/ui/Card";
import { ConnectionPanel } from "./ConnectionPanel";
import { ModeTabs } from "./ModeTabs";
import { KeywordForm } from "./KeywordForm";
import { DomainForm } from "./DomainForm";
import { ActivityLog } from "./ActivityLog";
import { ResultsTable } from "./ResultsTable";

function ToolSection() {
  const { loading, effectiveMode } = useScraper();

  if (loading) {
    return (
      <div className="mb-6 space-y-4">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-black/5 dark:bg-white/5" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <>
      <ModeTabs />
      <Card className="mb-6">{effectiveMode === "keyword" ? <KeywordForm /> : <DomainForm />}</Card>
    </>
  );
}

export function ScraperApp() {
  return (
    <main className="mx-auto w-full min-h-dvh max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ahrefs Website Scraper</h1>
        <p className="mt-2 text-sm opacity-70">
          Discover websites ranking for a keyword and pull Ahrefs metrics — or look up Domain Rating on the free tier.
        </p>
      </header>

      <ConnectionPanel />
      <ToolSection />
      <ActivityLog />
      <ResultsTable />
    </main>
  );
}
