import { Suspense, lazy } from "react";
import KpiCards       from "@/components/soc/KpiCards";
import SuricataAlerts  from "@/components/soc/SuricataAlerts";
import WazuhAlerts     from "@/components/soc/WazuhAlerts";
import BlockedIPList   from "@/components/soc/BlockedIPList";
import { useWazuhData } from "@/hooks/useWazuhData";

const MitreHeatmap   = lazy(() => import("@/components/soc/MitreHeatmap"));
const AttackTimeline = lazy(() => import("@/components/soc/AttackTimeline"));
const GeoAttackMap   = lazy(() => import("@/components/soc/GeoAttackMap"));

const ErrorBanner = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
    <span className="font-bold">Lỗi kết nối:</span> {msg}
  </div>
);

const ChunkFallback = ({ title }: { title: string }) => (
  <div className="soc-card">
    <p className="text-xs font-mono text-muted-foreground animate-pulse">Đang tải {title}…</p>
  </div>
);

const Index = () => {
  const {
    alerts,
    suricataAlerts,
    topAttackers,
    mitreData,
    timeline,
    kpi,
    geoData,
    loading,
    error,
  } = useWazuhData({
    needs: {
      alerts: true,
      suricataAlerts: true,
      topAttackers: true,
      blockedIPs: false,
      mitreData: true,
      timeline: true,
      kpi: true,
      geoData: true,
    },
    limits: {
      alerts: 200,
      suricataAlerts: 200,
    },
    pollMs: 10_000,
  });

  return (
    <div className="space-y-4">
      {error && <ErrorBanner msg={error} />}
      <KpiCards kpi={kpi} loading={loading} />

      <Suspense fallback={<ChunkFallback title="biểu đồ dòng thời gian" />}>
        <AttackTimeline timeline={timeline} loading={loading} />
      </Suspense>

      <div className="grid grid-cols-2 gap-4">
        <SuricataAlerts alerts={suricataAlerts} loading={loading} />
        <WazuhAlerts alerts={alerts} loading={loading} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BlockedIPList attackers={topAttackers} loading={loading} />
        <Suspense fallback={<ChunkFallback title="MITRE heatmap" />}>
          <MitreHeatmap mitreData={mitreData} loading={loading} />
        </Suspense>
      </div>

      <Suspense fallback={<ChunkFallback title="biểu đồ địa lý" />}>
        <GeoAttackMap geoData={geoData} loading={loading} />
      </Suspense>
    </div>
  );
};

export default Index;
