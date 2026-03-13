import MitreAttackChainView from "@/components/soc/mitre/MitreAttackChainView";
import MitreMatrix from "@/components/soc/mitre/MitreMatrix";
import MitreStatisticsPanel from "@/components/soc/mitre/MitreStatisticsPanel";
import MitreTechniqueDetailPanel from "@/components/soc/mitre/MitreTechniqueDetailPanel";
import { useMitreInsights } from "@/hooks/useMitreInsights";
import { formatMitreTime } from "@/utils/mitre";
import { Activity, RefreshCcw, ShieldAlert } from "lucide-react";

const MitrePage = () => {
  const {
    tactics,
    topTechniques,
    topTactics,
    topHosts,
    totalDetections,
    attackChain,
    selectedTechniqueId,
    selectedTechnique,
    setSelectedTechniqueId,
    detail,
    loading,
    detailLoading,
    refreshing,
    lastUpdated,
    error,
  } = useMitreInsights();

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}

      <section className="soc-card border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.94))]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-primary">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary/80">
                SOC MITRE ATT&amp;CK Intelligence
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Enterprise ATT&amp;CK visualization for real detections
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Correlates MITRE-tagged alerts from Wazuh and Suricata into a live ATT&amp;CK matrix, exposes technique drilldowns,
              and reconstructs the observed attack chain for SOC analysts.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-info/30 bg-info/10 px-4 py-3">
              <div className="flex items-center gap-2 text-info">
                <Activity className="h-4 w-4" />
                <span className="text-[11px] font-mono uppercase tracking-[0.18em]">Auto refresh</span>
              </div>
              <p className="mt-2 text-sm text-foreground">Every 30 seconds</p>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
              <div className="flex items-center gap-2 text-primary">
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-[11px] font-mono uppercase tracking-[0.18em]">Last update</span>
              </div>
              <p className="mt-2 text-sm text-foreground">{lastUpdated ? formatMitreTime(lastUpdated.toISOString()) : "Waiting for first sync"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.9fr)]">
        <MitreMatrix
          tactics={tactics}
          loading={loading}
          selectedTechniqueId={selectedTechniqueId}
          onSelectTechnique={(technique) => setSelectedTechniqueId(technique.id)}
        />

        <div className="space-y-6">
          <MitreStatisticsPanel
            totalDetections={totalDetections}
            topTechniques={topTechniques}
            topTactics={topTactics}
            topHosts={topHosts}
          />
          <MitreAttackChainView chain={attackChain} />
        </div>
      </div>

      <MitreTechniqueDetailPanel
        open={Boolean(selectedTechniqueId)}
        technique={selectedTechnique}
        detail={detail}
        loading={detailLoading}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTechniqueId(null);
          }
        }}
      />
    </div>
  );
};

export default MitrePage;
