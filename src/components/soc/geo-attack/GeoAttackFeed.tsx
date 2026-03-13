// ─────────────────────────────────────────────────────────────────────────────
//  GeoAttackFeed – Live scrolling event ticker for the attack map page
// ─────────────────────────────────────────────────────────────────────────────
//  Shows the most recent attack events with severity colour, flag icon, IP
//  address, and description in a compact Shodan-style feed.

import "flag-icons/css/flag-icons.min.css";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Wifi } from "lucide-react";
import type { GeoAttackEvent } from "@/hooks/useGeoAttackPage";

interface Props {
  events:   GeoAttackEvent[];
  loading?: boolean;
}

// Neon severity colours (mirrors AttackWorldMap palette)
const SEV_COLOR: Record<string, string> = {
  low:      "#38bdf8",
  medium:   "#facc15",
  high:     "#f97316",
  critical: "#ff3b3b",
};

const SEV_LABEL: Record<string, string> = {
  low:      "Thấp",
  medium:   "T.Bình",
  high:     "Cao",
  critical: "Nghiêm",
};

function sevKey(level: number): string {
  if (level >= 14) return "critical";
  if (level >= 10) return "high";
  if (level >= 7)  return "medium";
  return "low";
}

function relativeTime(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)             return `${Math.floor(diff)}s`;
    if (diff < 3600)           return `${Math.floor(diff / 60)}p`;
    if (diff < 86400)          return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  } catch {
    return "";
  }
}

const MAX_FEED = 60;

const GeoAttackFeed = ({ events, loading }: Props) => {
  const feed = events.slice(0, MAX_FEED);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl"
      style={{
        border:     "1px solid rgba(13,58,101,0.70)",
        background: "#010d1f",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(13,58,101,0.50)" }}
      >
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4" style={{ color: "#38bdf8" }} />
          <span
            className="text-[10px] font-mono uppercase tracking-[0.28em]"
            style={{ color: "#38bdf8" }}
          >
            Luồng tấn công
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: "#38bdf8" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: "#38bdf8" }}
            />
          </span>
          <span
            className="text-[10px] font-mono uppercase tracking-[0.18em]"
            style={{ color: "rgba(56,189,248,0.7)" }}
          >
            Trực tiếp
          </span>
        </div>
      </div>

      {/* Feed body */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p
            className="animate-pulse text-xs font-mono"
            style={{ color: "#38bdf8" }}
          >
            Đang tải…
          </p>
        </div>
      ) : feed.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-4">
          <Wifi className="h-8 w-8" style={{ color: "rgba(13,58,101,0.6)" }} />
          <p className="text-xs font-mono" style={{ color: "rgba(56,189,248,0.4)" }}>
            Chưa có dữ liệu tấn công mạng.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-px p-2">
            {feed.map((e, idx) => {
              const sk    = e.isAI ? "critical" : sevKey(e.level);
              const col   = e.isAI ? "#ff0055" : SEV_COLOR[sk];
              const label = e.isAI ? "AI" : SEV_LABEL[sk];

              return (
                <div
                  key={e.id || idx}
                  className="group flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={(ev) => {
                    (ev.currentTarget as HTMLElement).style.background =
                      "rgba(13,58,101,0.20)";
                  }}
                  onMouseLeave={(ev) => {
                    (ev.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                >
                  {/* Severity dot */}
                  <span
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: col,
                      boxShadow:        `0 0 5px ${col}`,
                    }}
                  />

                  {/* Flag */}
                  <div className="mt-0.5 shrink-0">
                    {e.countryCode ? (
                      <span
                        className={`fi fi-${e.countryCode} rounded-sm shadow`}
                        style={{ width: 14, height: 11, display: "inline-block" }}
                      />
                    ) : (
                      <span
                        className="inline-block rounded-sm"
                        style={{ width: 14, height: 11, background: "rgba(13,58,101,0.5)" }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span
                        className="truncate font-mono text-[11px] font-semibold"
                        style={{ color: "#facc15" }}
                      >
                        {e.srcIp}
                      </span>
                      <span
                        className="shrink-0 font-mono text-[9px] uppercase"
                        style={{ color: "rgba(140,170,200,0.5)" }}
                      >
                        {relativeTime(e.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {e.isAI && (
                        <BrainCircuit
                          className="h-2.5 w-2.5 shrink-0"
                          style={{ color: "#ff0055" }}
                        />
                      )}
                      <span
                        className="truncate text-[11px]"
                        style={{ color: "rgba(140,170,200,0.75)" }}
                        title={e.description}
                      >
                        {e.description || e.country || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Severity badge */}
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider"
                    style={{
                      color:      col,
                      border:     `1px solid ${col}40`,
                      background: `${col}15`,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default GeoAttackFeed;
