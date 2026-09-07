import { formatDate } from "@/lib/format";

export function Provenance({
  source,
  timestamp,
  lastUpdated,
}: {
  source?: string;
  timestamp?: string;
  lastUpdated?: string;
}) {
  return (
    <p className="text-xs text-gray-400">
      Source: <span className="font-medium uppercase">{source ?? "mock"}</span>
      {timestamp && <> · as of {formatDate(timestamp)}</>}
      {lastUpdated && <> · updated {formatDate(lastUpdated)}</>}
    </p>
  );
}
