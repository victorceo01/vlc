export function formatNaira(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value === null || value === undefined) return "—";
  if (opts?.compact) {
    return "₦" + compactNumber(value);
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
}

export function compactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return (value / 1e12).toFixed(2) + "T";
  if (abs >= 1e9) return (value / 1e9).toFixed(2) + "B";
  if (abs >= 1e6) return (value / 1e6).toFixed(2) + "M";
  if (abs >= 1e3) return (value / 1e3).toFixed(2) + "K";
  return String(value);
}

export function formatNumber(value: number | null | undefined, dp = 2): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: dp }).format(value);
}

export function formatPct(value: number | null | undefined, dp = 2): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(dp)}%`;
}

export function changeColor(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return "text-gray-500";
  return value > 0 ? "text-up" : "text-down";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
