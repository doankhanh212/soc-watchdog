import type { MitreChainStep } from "@/utils/mitre";
import { formatMitreTime } from "@/utils/mitre";
import { severityColor, severityLabel } from "@/utils/formatters";
import { ArrowDown, Link2 } from "lucide-react";

interface Props {
  chain: MitreChainStep[];
}

const MitreAttackChainView = ({ chain }: Props) => {
  return (
    <section className="soc-card border-warning/20 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(15,23,42,0.88))]">
      <div className="mb-4 border-b border-border/80 pb-4">
        <div className="mb-2 flex items-center gap-2 text-warning">
          <Link2 className="h-4 w-4" />
          <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-warning/80">
            Attack Chain View
          </span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">Observed attack progression</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sequence reconstructed from chronological MITRE-tagged detections in the last 24 hours.
        </p>
      </div>

      {chain.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/10 px-4 py-8 text-center text-sm text-muted-foreground">
          No sequential MITRE activity was available to build an attack chain.
        </div>
      ) : (
        <div className="space-y-2">
          {chain.map((step, index) => (
            <div key={`${step.timestamp}-${step.tactic}-${index}`}>
              <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-primary/80">
                      Step {index + 1}
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-foreground">{step.tactic}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.techniqueName}</p>
                  </div>
                  <span className={`soc-badge ${severityColor(step.level)}`}>
                    {severityLabel(step.level)}
                  </span>
                </div>

                <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
                  <div>
                    <div className="font-mono uppercase tracking-[0.18em] text-muted-foreground">Technique</div>
                    <div className="mt-1 font-mono text-foreground">{step.techniqueId}</div>
                  </div>
                  <div>
                    <div className="font-mono uppercase tracking-[0.18em] text-muted-foreground">First seen</div>
                    <div className="mt-1 text-foreground">{formatMitreTime(step.timestamp)}</div>
                  </div>
                  <div>
                    <div className="font-mono uppercase tracking-[0.18em] text-muted-foreground">Source IP</div>
                    <div className="mt-1 font-mono text-foreground">{step.srcIp}</div>
                  </div>
                  <div>
                    <div className="font-mono uppercase tracking-[0.18em] text-muted-foreground">Host</div>
                    <div className="mt-1 text-foreground">{step.host}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
                  <span className="line-clamp-1 max-w-[75%]">{step.description}</span>
                  <span className="font-mono text-warning">{step.count.toLocaleString()} alerts</span>
                </div>
              </div>

              {index < chain.length - 1 ? (
                <div className="flex justify-center py-2 text-primary/70">
                  <ArrowDown className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MitreAttackChainView;