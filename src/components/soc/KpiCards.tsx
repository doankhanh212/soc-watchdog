import { AlertTriangle, Crosshair, ShieldBan, Bell } from "lucide-react";
import type { KpiData } from "@/services/wazuhApi";

interface Props {
  kpi:      KpiData | null;
  loading?: boolean;
}

const KpiCards = ({ kpi, loading }: Props) => {
  const cards = [
    {
      label: "Cuộc tấn công đang diễn ra",
      value: loading ? "…" : String(kpi?.activeAttacks ?? 0),
      icon:  Crosshair,
      color: "text-danger" as const,
      glow:  "soc-glow-danger",
    },
    {
      label: "IP tấn công nhiều nhất",
      value: loading ? "…" : (kpi?.topAttackerIp ?? "—"),
      sub:   loading ? "" : `${(kpi?.topAttackerHits ?? 0).toLocaleString()} lượt`,
      icon:  AlertTriangle,
      color: "text-primary" as const,
      glow:  "soc-glow-primary",
    },
    {
      label: "IP đã bị chặn",
      value: loading ? "…" : String(kpi?.blockedIps ?? 0),
      icon:  ShieldBan,
      color: "text-accent" as const,
      glow:  "soc-glow-accent",
    },
    {
      label: "Tổng số cảnh báo",
      value: loading ? "…" : (kpi?.totalAlerts ?? 0).toLocaleString(),
      sub:   loading ? "" : `${kpi?.criticalAlerts ?? 0} nghiêm trọng`,
      icon:  Bell,
      color: "text-primary" as const,
      glow:  "soc-glow-primary",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`soc-card ${card.glow}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{card.label}</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${card.color}`}>{card.value}</p>
              {card.sub && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{card.sub}</p>}
            </div>
            <card.icon className={`h-5 w-5 ${card.color} opacity-60`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
