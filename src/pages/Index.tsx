import KpiCards       from "@/components/soc/KpiCards";
import SuricataAlerts  from "@/components/soc/SuricataAlerts";
import WazuhAlerts     from "@/components/soc/WazuhAlerts";
import BlockedIPList   from "@/components/soc/BlockedIPList";
import MitreHeatmap    from "@/components/soc/MitreHeatmap";
import AttackTimeline  from "@/components/soc/AttackTimeline";
import GeoAttackMap    from "@/components/soc/GeoAttackMap";
import { useWazuhData } from "@/hooks/useWazuhData";

const ErrorBanner = ({ msg }: { msg: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
    <span className="font-bold">Lỗi kết nối:</span> {msg}
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
  } = useWazuhData();

  return (
    <div className="space-y-4">
      {error && <ErrorBanner msg={error} />}
      <KpiCards      kpi={kpi}              loading={loading} />
      <AttackTimeline timeline={timeline}   loading={loading} />
      <div className="grid grid-cols-2 gap-4">
        <SuricataAlerts alerts={suricataAlerts} loading={loading} />
        <WazuhAlerts    alerts={alerts}         loading={loading} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <BlockedIPList  attackers={topAttackers} loading={loading} />
        <MitreHeatmap   mitreData={mitreData}    loading={loading} />
      </div>
      <GeoAttackMap geoData={geoData} loading={loading} />
    </div>
  );
};

export default Index;
