import type { ReactNode } from "react";
import { LEVEL_STYLES } from "@/lib/constants";
import type { StatusLevel } from "@/lib/types";

/** A colored, bordered message box keyed to a status level. */
export function StatusMessage({
  level,
  className = "",
  children,
}: {
  level: StatusLevel;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${LEVEL_STYLES[level]} ${className}`}>{children}</div>
  );
}
