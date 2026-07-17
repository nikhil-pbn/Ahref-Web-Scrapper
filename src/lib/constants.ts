import type { DownloadFormat, SelectOption, StatusLevel } from "./types";

/** Country options for keyword search (label + ISO 3166-1 alpha-2 code). */
export const COUNTRIES: SelectOption[] = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "in", label: "India" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "nl", label: "Netherlands" },
  { value: "br", label: "Brazil" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "sg", label: "Singapore" },
  { value: "za", label: "South Africa" },
];

/** Tailwind classes for each status level (badges, message boxes). */
export const LEVEL_STYLES: Record<StatusLevel, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  error: "bg-red-500/10 text-red-400 border-red-500/30",
};

/** Download format options for the results export dropdown. */
export const DOWNLOAD_FORMATS: { value: DownloadFormat; label: string }[] = [
  { value: "excel", label: "Excel (.xlsx)" },
  { value: "word", label: "Word (.doc)" },
  { value: "csv", label: "CSV (.csv)" },
  { value: "json", label: "JSON (.json)" },
];

/** Shared card surface styling. */
export const CARD =
  "rounded-xl border border-black/10 bg-black/[.02] p-5 dark:border-white/10 dark:bg-white/[.03]";
