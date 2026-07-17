import type { ReactNode } from "react";
import { CARD } from "@/lib/constants";

/** Standard card surface used for each section of the app. */
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`${CARD} ${className}`}>{children}</section>;
}
