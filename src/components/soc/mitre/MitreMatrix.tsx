import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { EnrichedMitreTactic, EnrichedMitreTechnique } from "@/utils/mitre";
import { getHeatTone } from "@/utils/mitre";
import { severityColor, severityLabel } from "@/utils/formatters";
import { ShieldAlert, Sparkles } from "lucide-react";

interface Props {
  tactics: EnrichedMitreTactic[];
  loading?: boolean;
  selectedTechniqueId?: string | null;
  onSelectTechnique: (technique: EnrichedMitreTechnique) => void;
}

const loadingColumns = Array.from({ length: 5 }, (_, index) => index);

const MitreMatrix = ({
  tactics,
  loading,
  selectedTechniqueId,
  onSelectTechnique,
}: Props) => {
  return (
    <section className="soc-card overflow-hidden border-primary/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.76))]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-primary/80">
              MITRE ATT&amp;CK Matrix
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Technique coverage across active tactics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real detections from Wazuh and Suricata over the last 24 hours, normalized into the enterprise ATT&amp;CK kill chain.
          </p>
        </div>
        <div className="rounded-full border border-info/30 bg-info/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.24em] text-info">
          Hover for detail
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-4">
          {loadingColumns.map((column) => (
            <div key={column} className="rounded-xl border border-border/70 bg-secondary/20 p-3">
              <div className="mb-3 h-4 w-28 animate-pulse rounded bg-secondary/60" />
              <div className="space-y-3">
                {loadingColumns.slice(0, 4).map((tile) => (
                  <div key={tile} className="h-24 animate-pulse rounded-xl border border-border/70 bg-secondary/30" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex min-w-max gap-4 pb-2">
            {tactics.map((tactic) => (
              <div
                key={tactic.tactic}
                className="w-[220px] shrink-0 rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(30,41,59,0.28),rgba(15,23,42,0.12))] p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{tactic.tactic}</h3>
                    <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                      {tactic.totalAlerts.toLocaleString()} alerts
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-primary/70" />
                </div>

                <div className="space-y-3">
                  {tactic.techniques.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-secondary/10 px-3 py-5 text-center text-xs text-muted-foreground">
                      No detections
                    </div>
                  ) : (
                    tactic.techniques.map((technique) => {
                      const isSelected = technique.id === selectedTechniqueId;
                      return (
                        <Tooltip key={`${tactic.tactic}-${technique.id}`}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onSelectTechnique(technique)}
                              className={[
                                "group w-full rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/60",
                                getHeatTone(technique.coverage),
                                isSelected ? "ring-2 ring-primary/60" : "",
                              ].join(" ")}
                            >
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-primary">
                                    {technique.id}
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
                                    {technique.name}
                                  </p>
                                </div>
                                <span className={`soc-badge ${severityColor(technique.maxSeverity)}`}>
                                  {severityLabel(technique.maxSeverity)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                <span className="font-mono uppercase tracking-[0.2em]">Alerts</span>
                                <span className="font-mono text-foreground">{technique.alertCount.toLocaleString()}</span>
                              </div>

                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/50">
                                <div
                                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(56,189,248,0.9),rgba(250,204,21,0.85),rgba(239,68,68,0.9))]"
                                  style={{ width: `${Math.max(8, Math.round(technique.coverage * 100))}%` }}
                                />
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[280px] border-border bg-popover/95 text-popover-foreground">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-mono text-xs font-semibold text-primary">{technique.id}</span>
                                <span className={`soc-badge ${severityColor(technique.maxSeverity)}`}>
                                  {severityLabel(technique.maxSeverity)}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground">{technique.name}</p>
                              <p className="line-clamp-4 text-xs leading-5 text-muted-foreground">
                                {technique.description}
                              </p>
                              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-info">
                                {technique.alertCount.toLocaleString()} detections
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </section>
  );
};

export default MitreMatrix;