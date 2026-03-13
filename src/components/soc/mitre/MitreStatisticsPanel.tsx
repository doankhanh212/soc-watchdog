import type { MitreMatrixTechnique, MitreStatItem } from "@/services/wazuhApi";
import { severityColor, severityLabel } from "@/utils/formatters";
import { Activity, Crosshair, ServerCrash, Sigma } from "lucide-react";

interface RankedTechnique extends MitreMatrixTechnique {
  name: string;
}

interface Props {
  totalDetections: number;
  topTechniques: RankedTechnique[];
  topTactics: MitreStatItem[];
  topHosts: MitreStatItem[];
}

const listClasses = "space-y-2";

const MitreStatisticsPanel = ({
  totalDetections,
  topTechniques,
  topTactics,
  topHosts,
}: Props) => {
  return (
    <section className="soc-card border-info/20 bg-[linear-gradient(180deg,rgba(8,47,73,0.28),rgba(15,23,42,0.9))]">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-info">
            <Sigma className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-info/80">
              MITRE Statistics
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Detection pressure and target profile</h2>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-right">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-primary/80">Total MITRE detections</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{totalDetections.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Crosshair className="h-4 w-4 text-danger" />
            Top techniques
          </div>
          <div className={listClasses}>
            {topTechniques.map((technique) => (
              <div key={`${technique.tactic}-${technique.id}`} className="rounded-xl border border-border/70 bg-secondary/10 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-[0.18em] text-primary">{technique.id}</div>
                    <p className="mt-1 text-sm font-medium text-foreground">{technique.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{technique.tactic}</p>
                  </div>
                  <span className={`soc-badge ${severityColor(technique.maxSeverity)}`}>
                    {severityLabel(technique.maxSeverity)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono uppercase tracking-[0.18em]">Alerts</span>
                  <span className="font-mono text-foreground">{technique.alertCount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity className="h-4 w-4 text-warning" />
              Top tactics
            </div>
            <div className={listClasses}>
              {topTactics.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/10 px-3 py-2.5">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="font-mono text-xs text-warning">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ServerCrash className="h-4 w-4 text-info" />
              Top attacked hosts
            </div>
            <div className={listClasses}>
              {topHosts.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/10 px-3 py-2.5">
                  <span className="max-w-[70%] truncate text-sm text-foreground" title={item.label}>
                    {item.label}
                  </span>
                  <span className="font-mono text-xs text-info">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MitreStatisticsPanel;