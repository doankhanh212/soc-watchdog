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
                B\u1ea3n \u0111\u1ed3 t\u1ea5n c\u00f4ng m\u1ea1ng to\u00e0n c\u1ea7u
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Gi\u00e1m s\u00e1t t\u1ea5n c\u00f4ng th\u1eddi gian th\u1ef1c cho ho\u1ea1t \u0111\u1ed9ng SOC
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Hi\u1ec3n th\u1ecb tr\u1ef1c ti\u1ebfp c\u00e1c phi\u1ebfn t\u1ea5n c\u00f4ng t\u1eeb Wazuh v\u00e0 Suricata v\u1edbi \u0111\u01b0\u1eddng neon ho\u1ea1t h\u1ecda,
              \u0111\u1ecba l\u00fd IP, lu\u1ed3ng c\u1ea3nh b\u00e1o theo m\u1ee9c \u0111\u1ed9 nghi\u00eam tr\u1ecdng v\u00e0 th\u1ed1ng k\u00ea \u00e1p l\u1ef1c t\u1ea5n c\u00f4ng 24 gi\u1edd.
            </p>
          </div>

          {/* Status cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
              <div className="flex items-center gap-2 text-success">
                <RadioTower className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Lu\u1ed3ng</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">Tr\u1ef1c ti\u1ebfp · 30s</p>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Đ\u1ed3ng b\u1ed9</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">
                {lastUpdated ? formatAttackTime(lastUpdated.toISOString()) : "\u0110ang ch\u1edd..."}
              </p>
            </div>

            <div className="rounded-2xl border border-info/30 bg-info/10 px-4 py-3">
              <div className="flex items-center gap-2 text-info">
                <MonitorDot className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">D\u1ea5u v\u1ebft</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">
                {loading ? "…" : `${geoAlerts.length} \u0111\u1ecba l\u00fd / ${(data?.alerts ?? []).length} t\u1ed5ng`}
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
                \u0110ang kh\u1edfi t\u1ea1o b\u1ea3n \u0111\u1ed3 t\u1ea5n c\u00f4ng...
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
            Lu\u1ed3ng c\u1ea3nh b\u00e1o th\u00f4ng minh
          </span>
        </div>
        <AttackFeed alerts={data?.alerts ?? []} loading={loading} />
      </div>
    </div>
  );
};

export default ThreatMonitoring;
