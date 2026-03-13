import type { AttackMapData } from "@/services/wazuhApi";
import { getAttackSeverity } from "@/utils/attackMap";
import {
  AlertTriangle,
  Globe2,
  Layers3,
  Network,
  Sigma,
} from "lucide-react";

interface Props {
  data: AttackMapData | undefined;
  loading?: boolean;
}

const severityCards = ["low", "medium", "high", "critical"] as const;

const AttackStatsPanel = ({ data, loading }: Props) => {
  return (
    <section className="soc-card border-danger/20 bg-[linear-gradient(180deg,rgba(30,41,59,0.92),rgba(2,6,23,0.94))]">
      <div className="mb-4 border-b border-border/80 pb-4">
        <div className="mb-2 flex items-center gap-2 text-danger">
          <Sigma className="h-4 w-4" />
          <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-danger/80">
            Thống kê tấn công
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Tổng hợp áp lực tấn công trong 24 giờ</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        {/* Total attacks */}
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em]">Tổng tấn công</span>
          </div>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {loading ? "…" : (data?.totalAttacks ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Severity breakdown */}
        <div className="grid gap-3 sm:grid-cols-2">
          {severityCards.map((key) => {
            const meta = getAttackSeverity(
              key === "low" ? 2 : key === "medium" ? 8 : key === "high" ? 12 : 15,
            );
            const count = data?.severity[key] ?? 0;
            return (
              <div
                key={key}
                className="rounded-2xl border border-border/70 bg-secondary/10 px-4 py-3"
              >
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  {meta.label}
                </div>
                <p className="mt-2 text-2xl font-semibold" style={{ color: meta.color }}>
                  {loading ? "…" : count.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Top attacking countries */}
        <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe2 className="h-4 w-4 text-info" />
            Quốc gia tấn công nhiều nhất
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="h-40 animate-pulse rounded-xl bg-secondary/20" />
            ) : (
              (data?.topCountries ?? []).map((country, idx) => (
                <div
                  key={country.label}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-info/10 text-[10px] font-mono text-info">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-foreground">{country.label}</span>
                  </div>
                  <span className="font-mono text-xs text-info">{country.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top attacking IPs */}
        <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Network className="h-4 w-4 text-primary" />
            IP tấn công nhiều nhất
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="h-40 animate-pulse rounded-xl bg-secondary/20" />
            ) : (
              (data?.topIps ?? []).map((item, idx) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-mono text-primary">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="font-mono text-xs text-primary">{item.count.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attack types */}
        <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Layers3 className="h-4 w-4 text-warning" />
            Loại tấn công
          </div>
          <div className="space-y-2">
            {loading ? (
              <div className="h-32 animate-pulse rounded-xl bg-secondary/20" />
            ) : (
              (data?.attackTypes ?? []).map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/60 bg-background/30 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="max-w-[75%] text-sm text-foreground">{item.label}</span>
                    <span className="font-mono text-xs text-warning">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AttackStatsPanel;