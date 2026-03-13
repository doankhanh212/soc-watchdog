// ─────────────────────────────────────────────────────────────────────────────
//  Top Attack Origins Panel
// ─────────────────────────────────────────────────────────────────────────────
//  Shows the top attacking countries with flag icons, attack counts, progress
//  bars and percentage contributions.

import "flag-icons/css/flag-icons.min.css";
import { Shield, TrendingUp } from "lucide-react";
import type { CountryAttackStat } from "@/hooks/useGeoAttackPage";

interface Props {
  countryStats: CountryAttackStat[];
  totalAttacks: number;
  loading?:     boolean;
}

const MAX_ROWS = 15;

const TopOriginsTable = ({ countryStats, totalAttacks, loading }: Props) => {
  const rows     = countryStats.slice(0, MAX_ROWS);
  const topCount = rows[0]?.attacks ?? 1; // for normalising bar widths

  return (
    <div className="soc-card flex h-full flex-col">

      {/* Header */}
      <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
        <TrendingUp className="h-4 w-4 text-warning" />
        <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-warning">
          Nguồn tấn công hàng đầu
        </h2>
      </div>

      {/* Column headings */}
      {!loading && rows.length > 0 && (
        <div className="mb-2 grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-2 px-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50">
          <span className="w-4" />
          <span>Quốc gia</span>
          <span className="text-right">Tấn công</span>
          <span className="w-10 text-right">%</span>
        </div>
      )}

      {/* Body */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="animate-pulse text-xs font-mono text-muted-foreground">Đang tải…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Shield className="h-8 w-8 text-muted-foreground/25" />
          <p className="text-xs font-mono text-muted-foreground">
            Chưa có dữ liệu tấn công mạng.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-0.5 overflow-y-auto">
          {rows.map((stat, idx) => {
            const barPct = topCount > 0 ? (stat.attacks / topCount) * 100 : 0;
            const isTop3 = idx < 3;

            return (
              <div
                key={stat.country}
                className="group relative grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-2 rounded-lg px-2 py-2 transition-colors hover:bg-secondary/30"
              >
                {/* Progress bar background */}
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                  style={{
                    width:           `${barPct}%`,
                    background:      isTop3
                      ? "linear-gradient(90deg,rgba(239,68,68,0.08),transparent)"
                      : "linear-gradient(90deg,rgba(56,189,248,0.06),transparent)",
                    maxWidth:        "100%",
                  }}
                />

                {/* Rank */}
                <span className="relative z-10 w-4 text-center text-[10px] font-mono text-muted-foreground/40">
                  {idx + 1}
                </span>

                {/* Flag + country name */}
                <div className="relative z-10 flex min-w-0 items-center gap-2">
                  {stat.countryCode ? (
                    <span
                      className={`fi fi-${stat.countryCode} shrink-0 rounded-sm shadow`}
                      style={{ width: 16, height: 12 }}
                    />
                  ) : (
                    <span className="h-3 w-4 shrink-0 rounded-sm bg-border/40" />
                  )}

                  <div className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-xs font-mono ${isTop3 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                      title={stat.country}
                    >
                      {stat.country}
                    </span>
                    {/* Inline progress bar */}
                    <div className="mt-0.5 h-0.5 w-full overflow-hidden rounded-full bg-border/30">
                      <div
                        className={`h-full rounded-full ${isTop3 ? "bg-danger" : "bg-primary/50"}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Attack count */}
                <span
                  className={`relative z-10 text-right text-xs font-mono tabular-nums ${
                    isTop3 ? "font-semibold text-danger" : "text-muted-foreground"
                  }`}
                >
                  {stat.attacks.toLocaleString("vi-VN")}
                </span>

                {/* Percentage */}
                <span
                  className={`relative z-10 w-10 text-right text-xs font-mono tabular-nums ${
                    isTop3 ? "font-semibold text-warning" : "text-muted-foreground/60"
                  }`}
                >
                  {stat.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {!loading && rows.length > 0 && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground/60">Tổng sự kiện (1 giờ)</span>
            <span className="font-semibold text-primary">
              {totalAttacks.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopOriginsTable;
