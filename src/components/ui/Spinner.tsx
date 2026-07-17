/** Small inline spinner for buttons in a loading state. */
export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white ${className}`} />;
}
