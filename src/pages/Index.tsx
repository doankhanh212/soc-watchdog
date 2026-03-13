import DashboardHeader from "@/components/soc/DashboardHeader";
import KpiCards from "@/components/soc/KpiCards";
import SuricataAlerts from "@/components/soc/SuricataAlerts";
import WazuhAlerts from "@/components/soc/WazuhAlerts";
import BlockedIPList from "@/components/soc/BlockedIPList";
import MitreHeatmap from "@/components/soc/MitreHeatmap";
import AttackTimeline from "@/components/soc/AttackTimeline";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="p-6 space-y-4">
        <KpiCards />
        <AttackTimeline />
        <div className="grid grid-cols-2 gap-4">
          <SuricataAlerts />
          <WazuhAlerts />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <BlockedIPList />
          <MitreHeatmap />
        </div>
      </main>
    </div>
  );
};

export default Index;
