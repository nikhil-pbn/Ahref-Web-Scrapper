"use client";

import { useEffect, useRef } from "react";
import { useScraper } from "@/context/ScraperContext";
import { LEVEL_STYLES } from "@/lib/constants";
import { Card } from "@/components/ui/Card";

export function ActivityLog() {
  const { running, log, progress } = useScraper();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  if (!running && log.length === 0) return null;

  return (
    <Card className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Activity</h2>
        {progress && (
          <span className="text-sm opacity-70">
            {progress.done}/{progress.total}
          </span>
        )}
      </div>

      {progress && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="max-h-64 space-y-1.5 overflow-y-auto font-mono text-sm">
        {log.map((entry, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase ${LEVEL_STYLES[entry.level]}`}
            >
              {entry.level}
            </span>
            <span className="min-w-0 wrap-break-word opacity-90">{entry.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </Card>
  );
}
