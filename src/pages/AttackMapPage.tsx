// ─────────────────────────────────────────────────────────────────────────────
//  HQG Security SOC Platform – Bản đồ tấn công địa lý (Geo Attack Map Page)
// ─────────────────────────────────────────────────────────────────────────────
//  Visualises live attack origins on a Shodan / Kaspersky-style world map.
//
//  Data sources:
//    • wazuh-alerts-* (data.srcip / data.src_ip fields)
//    • ai-anomaly-alerts (future-ready – degrades to empty silently)
//
//  Refreshes every 30 seconds.  Empty state is handled gracefully.

import { Suspense, lazy } from "react";
import TopOriginsTable from "@/components/soc/geo-attack/TopOriginsTable";
import { useGeoAttackPage } from "@/hooks/useGeoAttackPage";
import { formatAttackTime } from "@/utils/attackMap";
import {
  BrainCircuit,
  Globe2,
  MapPin,
  MonitorDot,
  RadioTower,
  RefreshCcw,
  Shield,
  ShieldAlert,
  Zap,
} from "lucide-react";

// Lazy-load map component (imports world-atlas GeoJSON chunk)
const AttackWorldMap = lazy(
  () => import("@/components/soc/geo-attack/AttackWorldMap"),
);

// ─────────────────────────────────────────────────────────────────────────────

const AttackMapPage = () => {
  const { data, loading, refreshing, lastUpdated, error } = useGeoAttackPage();

  const events       = data?.events       ?? [];
  const countryStats = data?.countryStats ?? [];
  const totalAttacks = data?.totalAttacks ?? 0;
  const aiTotal      = data?.aiTotal      ?? 0;
  const distinctCountries = countryStats.length;

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <section className="soc-card border-info/20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(239,68,68,0.12),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94))]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          {/* Title block */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-info">
              <Globe2 className="h-4 w-4" />
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-info/80">
                Bản đồ tấn công địa lý
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Giám sát tấn công mạng toàn cầu theo thời gian thực
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Heatmap nguồn tấn công từ{" "}
              <span className="text-info font-mono">Wazuh</span> và{" "}
              <span className="text-danger font-mono">AI anomaly detection</span>.
              Mỗi điểm sáng thể hiện một địa chỉ IP đang tấn công hạ tầng giám sát.
              Cập nhật mỗi 30 giây.
            </p>
          </div>

          {/* Status cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Live stream */}
            <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
              <div className="flex items-center gap-2 text-success">
                <RadioTower className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Luồng</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">Trực tiếp · 30s</p>
            </div>

            {/* Last sync */}
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Đồng bộ</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">
                {lastUpdated
                  ? formatAttackTime(lastUpdated.toISOString())
                  : "Đang chờ…"}
              </p>
            </div>

            {/* Coverage */}
            <div className="rounded-2xl border border-info/30 bg-info/10 px-4 py-3">
              <div className="flex items-center gap-2 text-info">
                <MonitorDot className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">Phạm vi</span>
              </div>
              <p className="mt-1.5 text-sm text-foreground">
                {loading ? "…" : `${distinctCountries} quốc gia / ${totalAttacks} sự kiện`}
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

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total attacks */}
        <div className="soc-card flex items-center gap-3 border-primary/20">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5">
            <ShieldAlert className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Tổng tấn công
            </p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {loading ? "…" : totalAttacks.toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Countries */}
        <div className="soc-card flex items-center gap-3 border-info/20">
          <div className="rounded-xl border border-info/30 bg-info/10 p-2.5">
            <MapPin className="h-5 w-5 text-info" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Quốc gia nguồn
            </p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {loading ? "…" : distinctCountries.toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        {/* AI detections */}
        <div className="soc-card flex items-center gap-3 border-danger/20">
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-2.5">
            <BrainCircuit className="h-5 w-5 text-danger" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              AI Phát hiện
            </p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {loading ? "…" : aiTotal.toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Top country */}
        <div className="soc-card flex items-center gap-3 border-warning/20">
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-2.5">
            <Shield className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Nguồn số 1
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              {loading
                ? "…"
                : countryStats[0]?.country ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Main grid: map + right panel ─────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.75fr)]">

        {/* World map (lazy) */}
        <Suspense
          fallback={
            <div className="soc-card flex h-[680px] items-center justify-center border-info/20 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,10,22,0.96))]">
              <p className="animate-pulse text-xs font-mono text-muted-foreground">
                Đang khởi tạo bản đồ tấn công…
              </p>
            </div>
          }
        >
          <AttackWorldMap events={events} loading={loading} />
        </Suspense>

        {/* Right panel: Top origins table */}
        <TopOriginsTable
          countryStats={countryStats}
          totalAttacks={totalAttacks}
          loading={loading}
        />
      </div>

      {/* ── AI anomaly highlight panel ────────────────────────────────────── */}
      {!loading && aiTotal > 0 && (
        <section className="soc-card border-danger/25 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.10),transparent_40%),linear-gradient(180deg,rgba(2,6,23,0.97),rgba(15,6,6,0.94))]">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-2.5">
              <BrainCircuit className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-danger">
                AI Phát hiện bất thường đang hoạt động
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Có{" "}
                <span className="font-semibold text-danger">
                  {aiTotal} sự kiện
                </span>{" "}
                được phát hiện bởi mô hình AI từ chỉ mục{" "}
                <span className="font-mono text-foreground/80">ai-anomaly-alerts</span>.
                Các điểm đỏ nhấp nháy nhanh trên bản đồ thể hiện các nguồn tấn công được AI xác nhận.
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-danger">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
                </span>
                Đang giám sát
              </span>
            </div>
          </div>

          {/* AI events list */}
          <div className="mt-4 space-y-1.5 max-h-48 overflow-y-auto">
            {events
              .filter((e) => e.isAI)
              .slice(0, 10)
              .map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-danger/15 bg-danger/5 px-3 py-2 text-xs font-mono"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 text-danger font-semibold">
                      {e.country || "—"}
                    </span>
                    <span className="text-muted-foreground/70 font-mono">
                      {e.srcIp}
                    </span>
                    <span className="truncate text-muted-foreground" title={e.description}>
                      {e.description}
                    </span>
                  </div>
                  {e.riskScore > 0 && (
                    <span className="ml-3 shrink-0 rounded border border-danger/30 bg-danger/15 px-2 py-0.5 text-danger">
                      Risk {e.riskScore}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── AI future-ready notice (shown only before AI data arrives) ───── */}
      {!loading && aiTotal === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-secondary/20 px-4 py-3 text-xs font-mono text-muted-foreground">
          <BrainCircuit className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          <span>
            Chỉ mục{" "}
            <span className="text-foreground/80">ai-anomaly-alerts</span>{" "}
            chưa có dữ liệu. Khi mô hình AI phát hiện bất thường, các điểm đỏ sẽ xuất hiện trên bản đồ.
          </span>
        </div>
      )}
    </div>
  );
};

export default AttackMapPage;
