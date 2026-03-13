import type { AttackMapData } from "@/services/wazuhApi";
import { getAttackSeverity } from "@/utils/attackMap";
import { AlertTriangle, Globe2, Layers3, Sigma } from "lucide-react";

interface Props {
  data: AttackMapData | undefined;
  loading?: boolean;
}

const AttackStatsPanel = ({ data, loading }: Props) => {
  const severityCards = [
    { key: "low", count: data?.severity.low ?? 0 },
    { key: "medium", count: data?.severity.medium ?? 0 },
    { key: "high", count: data?.severity.high ?? 0 },
    { key: "critical", count: data?.severity.critical ?? 0 },
  ] as const;

  return (
    <section className="soc-card border-danger/20 bg-[linear-gradient(180deg,rgba(30,41,59,0.92),rgba(2,6,23,0.94))]">
      <div className="mb-4 border-b border-border/80 pb-4">
        <div className="mb-2 flex items-center gap-2 text-danger">
          <Sigma className="h-4 w-4" />
          <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-danger/80">
            Attack Statistics
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">24-hour attack pressure summary</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em]">Total attacks</span>
          </div>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {loading ? "…" : (data?.totalAttacks ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {severityCards.map((item) => {
            const meta = getAttackSeverity(item.key === "low" ? 2 : item.key === "medium" ? 8 : item.key === "high" ? 12 : 15);
            return (
              <div key={item.key} className="rounded-2xl border border-border/70 bg-secondary/10 px-4 py-3">
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  {meta.label}
                </div>
                <p className="mt-2 text-2xl font-semibold" style={{ color: meta.color }}>
                  {loading ? "…" : item.count.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Globe2 className="h-4 w-4 text-info" />
            Top attacking countries
          </div>
          <div className="space-y-2">
            {(loading ? [] : data?.topCountries ?? []).map((country) => (
              <div key={country.label} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2.5">
                <span className="text-sm text-foreground">{country.label}</span>
                <span className="font-mono text-xs text-info">{country.count.toLocaleString()}</span>
              </div>
            ))}
            {loading ? <div className="h-40 animate-pulse rounded-xl bg-secondary/20" /> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Layers3 className="h-4 w-4 text-warning" />
            Attack types
          </div>
          <div className="space-y-2">
            {(loading ? [] : data?.attackTypes ?? []).map((item) => (
              <div key={item.label} className="rounded-xl border border-border/60 bg-background/30 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="max-w-[75%] text-sm text-foreground">{item.label}</span>
                  <span className="font-mono text-xs text-warning">{item.count.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {loading ? <div className="h-32 animate-pulse rounded-xl bg-secondary/20" /> : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AttackStatsPanel;