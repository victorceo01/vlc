export function scoreColor(score: number | null): string {
  if (score === null) return "bg-gray-200 text-gray-600";
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= 55) return "bg-lime-100 text-lime-800";
  if (score >= 40) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function ScoreBadge({
  score,
  confidence,
  size = "md",
}: {
  score: number | null;
  confidence?: string;
  size?: "sm" | "md" | "lg";
}) {
  const insufficient = score === null || confidence === "insufficient";
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-2xl px-4 py-2",
  };
  if (insufficient) {
    return (
      <span
        className={`inline-flex items-center rounded-full font-semibold bg-gray-200 text-gray-600 ${sizes[size]}`}
        title="Insufficient data to compute a score"
      >
        Insufficient data
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${scoreColor(score)} ${sizes[size]}`}
    >
      {score}
      {size !== "lg" && <span className="ml-0.5 font-normal opacity-70">/100</span>}
    </span>
  );
}
