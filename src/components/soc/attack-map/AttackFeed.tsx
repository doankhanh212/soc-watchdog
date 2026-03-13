import { ScrollArea } from "@/components/ui/scroll-area";
import type { AttackMapAlert } from "@/services/wazuhApi";
import { formatAttackTime, getAttackSeverity } from "@/utils/attackMap";
import { Activity, ArrowRight, Wifi } from "lucide-react";

interface Props {
  alerts: AttackMapAlert[];
  loading?: boolean;
}

const MAX_FEED = 50;

const AttackFeed = ({ alerts, loading }: Props) => {
  return (
    <section className="soc-card border-primary/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.92))]">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Wifi className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-primary/80">
              Lu\u1ed3ng tr\u1ef1c ti\u1ebfp
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Lu\u1ed3ng c\u1ea3nh b\u00e1o b\u1ea3o m\u1eadt th\u1eddi gian th\u1ef1c</h2>
        </div>
        <div className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-success">
          \u0110\u1ed3ng b\u1ed9 30s
        </div>
      </div>

      <ScrollArea className="h-[540px] pr-3">
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl border border-border/70 bg-secondary/20" />
            ))
          ) : alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/10 px-4 py-10 text-center text-sm text-muted-foreground">
              Kh\u00f4ng c\u00f3 c\u1ea3nh b\u00e1o n\u00e0o c\u00f3 IP ngu\u1ed3n trong 24 gi\u1edd qua.
            </div>
          ) : (
            alerts.slice(0, MAX_FEED).map((alert) => {
              const severity = getAttackSeverity(alert.level);
              return (
                <article
                  key={alert.id}
                  className="rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.5),rgba(15,23,42,0.24))] p-4 transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-info/80">
                        <span>{alert.country || "Unknown"}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span>{alert.agent}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{alert.description}</p>
                    </div>
                    <span className={`soc-badge shrink-0 ${severity.badgeClass}`}>
                      {severity.label}
                    </span>
                  </div>

                  <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <div className="font-mono uppercase tracking-[0.18em]">Th\u1eddi gian</div>
                      <div className="mt-1 text-foreground">{formatAttackTime(alert.rawTimestamp)}</div>
                    </div>
                    <div>
                      <div className="font-mono uppercase tracking-[0.18em]">IP ngu\u1ed3n</div>
                      <div className="mt-1 font-mono text-primary">{alert.srcIp || "—"}</div>
                    </div>
                    {alert.destIp && (
                      <div>
                        <div className="font-mono uppercase tracking-[0.18em]">IP \u0111\u00edch</div>
                        <div className="mt-1 font-mono text-info">{alert.destIp}</div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                      <span className="text-foreground">M\u1ee9c {alert.level}</span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </ScrollArea>
    </section>
  );
};

export default AttackFeed;