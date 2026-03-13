import { Suspense, lazy } from "react";
import AttackFeed from "@/components/soc/attack-map/AttackFeed";
import AttackStatsPanel from "@/components/soc/attack-map/AttackStatsPanel";
import { useAttackMapInsights } from "@/hooks/useAttackMapInsights";
import { formatAttackTime } from "@/utils/attackMap";
import {
  Globe2,
  MonitorDot,
  RadioTower,
  RefreshCcw,
  ShieldAlert,
  Zap,
} from "lucide-react";

const RealTimeAttackMap = lazy(
  () => import("@/components/soc/attack-map/RealTimeAttackMap"),
);

const ThreatMonitoring = () => {
  const { data, loading, refreshing, lastUpdated, error } =
    useAttackMapInsights();

  const geoAlerts = (data?.alerts ?? []).filter((a) => !!a.country);

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <section className="soc-card border-info/20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94))]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-info">
              <Globe2 className="h-4 w-4" />
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-info/80">
                Global Cyber Attack Map
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Real-time attack visualization for SOC operations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Live cyber warfare view of Wazuh and Suricata detections with animated neon attack lines,
              IP geolocation, severity-aware alert flow, and 24-hour threat pressure metrics.
            </p>
          </div>

          {/* Status cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
              <div className="flex items-center gap-2 text-success">
                <RadioTower className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Feed</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">Live · 30s</p>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Sync</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">
                {lastUpdated ? formatAttackTime(lastUpdated.toISOString()) : "Waiting…"}
              </p>
            </div>

            <div className="rounded-2xl border border-info/30 bg-info/10 px-4 py-3">
              <div className="flex items-center gap-2 text-info">
                <MonitorDot className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Traces</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">
                {loading ? "…" : `${geoAlerts.length} geo / ${(data?.alerts ?? []).length} total`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-4 py-2 text-danger text-xs font-mono">
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Map + Stats grid ─────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.85fr)]">
        <Suspense
          fallback={
            <div className="soc-card flex h-[660px] items-center justify-center border-info/20 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,10,22,0.96))]">
              <p className="text-xs font-mono text-muted-foreground animate-pulse">
                Initializing global attack map…
              </p>
            </div>
          }
        >
          <RealTimeAttackMap alerts={geoAlerts} loading={loading} />
        </Suspense>
        <AttackStatsPanel data={data} loading={loading} />
      </div>

      {/* ── Alert intelligence feed ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <ShieldAlert className="h-4 w-4" />
          <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-primary/80">
            Alert Intelligence Feed
          </span>
        </div>
        <AttackFeed alerts={data?.alerts ?? []} loading={loading} />
      </div>
    </div>
  );
};

export default ThreatMonitoring;
