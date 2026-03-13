import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MitreTechniqueDetail } from "@/services/wazuhApi";
import type { EnrichedMitreTechnique } from "@/utils/mitre";
import { formatMitreTime } from "@/utils/mitre";
import { severityColor, severityLabel } from "@/utils/formatters";
import { Activity, BadgeAlert, ExternalLink, Server, Shield, TimerReset } from "lucide-react";

interface Props {
  open: boolean;
  technique: EnrichedMitreTechnique | null;
  detail: MitreTechniqueDetail | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
}

const Metric = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  tone: string;
}) => (
  <div className="rounded-2xl border border-border/70 bg-secondary/10 p-3">
    <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
      <Icon className={`h-4 w-4 ${tone}`} />
      {label}
    </div>
    <div className="text-sm font-semibold text-foreground">{value}</div>
  </div>
);

const MitreTechniqueDetailPanel = ({
  open,
  technique,
  detail,
  loading,
  onOpenChange,
}: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-border bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-0 sm:max-w-[680px]"
      >
        <SheetHeader className="border-b border-border/80 px-6 py-5">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <BadgeAlert className="h-4 w-4" />
                <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-primary/80">
                  Technique Drilldown
                </span>
              </div>
              <SheetTitle className="text-left text-xl text-foreground">
                {technique?.id ?? "Technique details"} {technique ? `· ${technique.name}` : ""}
              </SheetTitle>
              <SheetDescription className="mt-2 text-left text-sm leading-6 text-muted-foreground">
                {technique?.description ?? "Select a technique tile to inspect correlated alerts, hosts, and timeline activity."}
              </SheetDescription>
            </div>
            {technique ? (
              <span className={`soc-badge ${severityColor(detail?.maxSeverity ?? technique.maxSeverity)}`}>
                {severityLabel(detail?.maxSeverity ?? technique.maxSeverity)}
              </span>
            ) : null}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-112px)]">
          <div className="space-y-6 px-6 py-6">
            {loading && technique ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-2xl border border-border/70 bg-secondary/20" />
                  ))}
                </div>
                <div className="h-60 animate-pulse rounded-2xl border border-border/70 bg-secondary/20" />
                <div className="h-72 animate-pulse rounded-2xl border border-border/70 bg-secondary/20" />
              </div>
            ) : technique && detail ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Metric
                    icon={Activity}
                    label="Total alerts"
                    value={detail.totalAlerts.toLocaleString()}
                    tone="text-danger"
                  />
                  <Metric
                    icon={Shield}
                    label="Tactic"
                    value={technique.tacticLabel}
                    tone="text-primary"
                  />
                  <Metric
                    icon={BadgeAlert}
                    label="Top attacker IP"
                    value={detail.topAttackerIp}
                    tone="text-warning"
                  />
                  <Metric
                    icon={Server}
                    label="Affected hosts"
                    value={detail.affectedHostCount.toLocaleString()}
                    tone="text-info"
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Alert timeline</h3>
                      <p className="mt-1 text-xs text-muted-foreground">30-minute buckets across the last 24 hours</p>
                    </div>
                    {technique.url ? (
                      <a
                        href={technique.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-info/30 bg-info/10 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em] text-info transition-colors hover:border-info/50 hover:bg-info/15"
                      >
                        MITRE reference
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </div>

                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={detail.timeline}>
                        <defs>
                          <linearGradient id="mitreTimelineFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="hsla(225, 30%, 18%, 0.5)" vertical={false} />
                        <XAxis
                          dataKey="time"
                          tick={{ fill: "hsl(215 15% 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: "hsl(215 15% 50%)", fontSize: 11, fontFamily: "JetBrains Mono" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.96)",
                            border: "1px solid rgba(51, 65, 85, 0.9)",
                            borderRadius: 16,
                            color: "#e2e8f0",
                          }}
                          formatter={(value: number, _name, item) => [
                            `${value.toLocaleString()} alerts`,
                            `Peak severity ${severityLabel(Number(item.payload.maxSeverity ?? 0))}`,
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="alerts"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          fill="url(#mitreTimelineFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <TimerReset className="h-4 w-4 text-info" />
                      Affected hosts
                    </div>
                    <div className="space-y-2">
                      {detail.affectedHosts.map((host) => (
                        <div key={host.label} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/30 px-3 py-2.5">
                          <span className="max-w-[70%] truncate text-sm text-foreground" title={host.label}>
                            {host.label}
                          </span>
                          <span className="font-mono text-xs text-info">{host.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-secondary/10 p-4">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BadgeAlert className="h-4 w-4 text-danger" />
                      Recent alerts
                    </div>
                    <div className="space-y-3">
                      {detail.recentAlerts.map((alert) => (
                        <div key={alert.id} className="rounded-xl border border-border/70 bg-background/30 p-3">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-mono uppercase tracking-[0.18em] text-primary/80">
                                {formatMitreTime(alert.timestamp)}
                              </div>
                              <p className="mt-1 text-sm text-foreground">{alert.description}</p>
                            </div>
                            <span className={`soc-badge ${severityColor(alert.level)}`}>
                              {severityLabel(alert.level)}
                            </span>
                          </div>
                          <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            <div>
                              <span className="font-mono uppercase tracking-[0.18em]">Source IP</span>
                              <div className="mt-1 font-mono text-foreground">{alert.srcIp}</div>
                            </div>
                            <div>
                              <span className="font-mono uppercase tracking-[0.18em]">Host</span>
                              <div className="mt-1 text-foreground">{alert.agent}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/10 px-4 py-10 text-center text-sm text-muted-foreground">
                Select a technique tile from the matrix to open its detailed timeline, affected hosts, and recent alerts.
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MitreTechniqueDetailPanel;