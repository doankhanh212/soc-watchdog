// ─────────────────────────────────────────────────────────────────────────────
//  Security SOC Platform – Bản đồ tấn công địa lý (Geo Attack Map Page)
// ─────────────────────────────────────────────────────────────────────────────
//  Visualises live attack origins on a Shodan / Kaspersky-style world map.
//
//  Data sources:
//    • wazuh-alerts-* (data.srcip / data.src_ip fields)
//    • ai-anomaly-alerts (future-ready – degrades to empty silently)
//
//  Refreshes every 30 seconds.  Empty state is handled gracefully.

import { Suspense, lazy, useMemo, type ReactNode } from "react";
import TopOriginsTable from "@/components/soc/geo-attack/TopOriginsTable";
import GeoAttackFeed from "@/components/soc/geo-attack/GeoAttackFeed";
import { useGeoAttackPage } from "@/hooks/useGeoAttackPage";
import {
  BrainCircuit,
  Globe2,
  MapPin,
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

interface KpiItem {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
  border: string;
  bg: string;
  truncate?: boolean;
}

const AttackMapPage = () => {
  const { data, loading, refreshing, lastUpdated, error } = useGeoAttackPage();

  const events            = useMemo(() => data?.events       ?? [], [data]);
  const countryStats      = useMemo(() => data?.countryStats ?? [], [data]);
  const totalAttacks      = data?.totalAttacks ?? 0;
  const aiTotal           = data?.aiTotal      ?? 0;
  const distinctCountries = countryStats.length;

  const latestEvent = events[0] ?? null;

  const kpis: KpiItem[] = [
    {
      icon: <ShieldAlert className="h-5 w-5" />,
      label: "Tổng tấn công",
      value: loading ? "…" : totalAttacks.toLocaleString("vi-VN"),
      color: "#38bdf8", border: "rgba(56,189,248,0.25)", bg: "rgba(56,189,248,0.08)",
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: "Quốc gia nguồn",
      value: loading ? "…" : distinctCountries.toLocaleString("vi-VN"),
      color: "#facc15", border: "rgba(250,204,21,0.25)", bg: "rgba(250,204,21,0.08)",
    },
    {
      icon: <BrainCircuit className="h-5 w-5" />,
      label: "AI Phát hiện",
      value: loading ? "…" : aiTotal.toLocaleString("vi-VN"),
      color: "#ff0055", border: "rgba(255,0,85,0.25)", bg: "rgba(255,0,85,0.08)",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: "Nguồn số 1",
      value: loading ? "…" : (countryStats[0]?.country ?? "—"),
      color: "#f97316", border: "rgba(249,115,22,0.25)", bg: "rgba(249,115,22,0.08)",
      truncate: true,
    },
  ];

  return (
    <div className="space-y-4">

      {/* ── Title bar ────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-3.5"
        style={{
          border:     "1px solid rgba(13,58,101,0.60)",
          background: "linear-gradient(90deg,rgba(1,13,31,0.96),rgba(3,18,40,0.94))",
        }}
      >
        <div className="flex items-center gap-3">
          <Globe2 className="h-5 w-5" style={{ color: "#38bdf8" }} />
          <div>
            <h1 className="text-base font-semibold tracking-tight" style={{ color: "#c8daff" }}>
              Bản đồ tấn công địa lý – Thời gian thực
            </h1>
            <p className="text-[11px] font-mono" style={{ color: "rgba(56,189,248,0.6)" }}>
              Wazuh • ai-anomaly-alerts • Cập nhật mỗi 30 giây
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: "rgba(140,170,200,0.6)" }}>
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} style={{ color: "#38bdf8" }} />
              {lastUpdated.toLocaleTimeString("vi-VN", { hour12: false })}
            </span>
          )}
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{ border: "1px solid rgba(56,189,248,0.25)", background: "rgba(56,189,248,0.08)" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#38bdf8" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "#38bdf8" }} />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "#38bdf8" }}>Trực tiếp</span>
          </span>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-mono"
          style={{ border: "1px solid rgba(255,59,59,0.30)", background: "rgba(255,59,59,0.08)", color: "#ff3b3b" }}>
          <Zap className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Hero map (full width) ─────────────────────────────────────────── */}
      <Suspense
        fallback={
          <div className="flex h-[630px] items-center justify-center rounded-2xl"
            style={{ border: "1px solid rgba(13,58,101,0.70)", background: "#010810" }}>
            <p className="animate-pulse text-xs font-mono" style={{ color: "#38bdf8" }}>
              Đang khởi tạo bản đồ tấn công…
            </p>
          </div>
        }
      >
        <AttackWorldMap events={events} loading={loading} latestEvent={latestEvent} />
      </Suspense>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="flex items-center gap-3 rounded-xl px-4 py-3.5"
            style={{ border: `1px solid ${k.border}`, background: k.bg }}
          >
            <div className="rounded-xl p-2.5" style={{ border: `1px solid ${k.border}`, background: k.bg, color: k.color }}>
              {k.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(140,170,200,0.6)" }}>
                {k.label}
              </p>
              <p
                className={`mt-0.5 font-bold tabular-nums ${k.truncate ? "truncate text-sm" : "text-xl"}`}
                style={{ color: "#c8daff" }}
                title={k.truncate ? String(k.value) : undefined}
              >
                {k.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom grid: Top Origins | Live Feed ─────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">
        <TopOriginsTable countryStats={countryStats} totalAttacks={totalAttacks} loading={loading} />
        <div className="h-[480px]">
          <GeoAttackFeed events={events} loading={loading} />
        </div>
      </div>

      {/* ── AI anomaly panel ─────────────────────────────────────────────── */}
      {!loading && aiTotal > 0 && (
        <div
          className="rounded-xl px-5 py-4"
          style={{
            border:     "1px solid rgba(255,0,85,0.25)",
            background: "radial-gradient(circle at top left,rgba(255,0,85,0.08),transparent 40%),#010d1f",
          }}
        >
          <div className="flex flex-wrap items-start gap-4">
            <div className="rounded-xl p-2.5" style={{ border: "1px solid rgba(255,0,85,0.30)", background: "rgba(255,0,85,0.10)" }}>
              <BrainCircuit className="h-5 w-5" style={{ color: "#ff0055" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold" style={{ color: "#ff0055" }}>AI Phát hiện bất thường đang hoạt động</h3>
              <p className="mt-1 text-xs" style={{ color: "rgba(140,170,200,0.75)" }}>
                Có <span className="font-semibold" style={{ color: "#ff0055" }}>{aiTotal} sự kiện</span> từ chỉ mục{" "}
                <span className="font-mono" style={{ color: "rgba(200,218,255,0.8)" }}>ai-anomaly-alerts</span>.
                Điểm đỏ nhấp nháy nhanh = nguồn AI xác nhận.
              </p>
            </div>
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-wider"
              style={{ border: "1px solid rgba(255,0,85,0.30)", background: "rgba(255,0,85,0.10)", color: "#ff0055" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#ff0055" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "#ff0055" }} />
              </span>
              Đang giám sát
            </span>
          </div>
          <div className="mt-4 max-h-44 space-y-1.5 overflow-y-auto">
            {events.filter((e) => e.isAI).slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-mono"
                style={{ border: "1px solid rgba(255,0,85,0.12)", background: "rgba(255,0,85,0.05)" }}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 font-semibold" style={{ color: "#ff0055" }}>{e.country || "—"}</span>
                  <span style={{ color: "#facc15" }}>{e.srcIp}</span>
                  <span className="truncate" style={{ color: "rgba(140,170,200,0.7)" }} title={e.description}>{e.description}</span>
                </div>
                {e.riskScore > 0 && (
                  <span className="ml-3 shrink-0 rounded px-2 py-0.5"
                    style={{ border: "1px solid rgba(255,0,85,0.30)", background: "rgba(255,0,85,0.12)", color: "#ff0055" }}>
                    Risk {e.riskScore}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Future-ready AI notice ────────────────────────────────────────── */}
      {!loading && aiTotal === 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-mono"
          style={{ border: "1px solid rgba(13,58,101,0.40)", background: "rgba(1,13,31,0.60)", color: "rgba(56,189,248,0.50)" }}>
          <BrainCircuit className="h-4 w-4 shrink-0" />
          <span>
            Chỉ mục <span style={{ color: "rgba(200,218,255,0.7)" }}>ai-anomaly-alerts</span> chưa có dữ liệu.
            Khi mô hình AI phát hiện bất thường, các điểm đỏ nhấp nháy sẽ xuất hiện trên bản đồ.
          </span>
        </div>
      )}
    </div>
  );
};

export default AttackMapPage;
