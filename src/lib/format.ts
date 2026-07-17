/** Format a nullable number with thousands separators, or an em dash if empty. */
export function num(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString();
}

/** Format a nullable USD amount, or an em dash if empty. */
export function usd(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}
