import { AlertTriangle, Crosshair, ShieldBan, Bell } from "lucide-react";
import { kpiData } from "@/data/mockData";

const cards = [
  {
    label: "Active Attacks",
    value: kpiData.activeAttacks,
    icon: Crosshair,
    color: "text-danger" as const,
    glow: "soc-glow-danger",
  },
  {
    label: "Top Attacker IP",
    value: kpiData.topAttackerIp,
    sub: `${kpiData.topAttackerHits.toLocaleString()} hits`,
    icon: AlertTriangle,
    color: "text-primary" as const,
    glow: "soc-glow-primary",
  },
  {
    label: "Blocked IPs",
    value: kpiData.blockedIps,
    icon: ShieldBan,
    color: "text-accent" as const,
    glow: "soc-glow-accent",
  },
  {
    label: "Total Alerts",
    value: kpiData.totalAlerts.toLocaleString(),
    sub: `${kpiData.criticalAlerts} critical`,
    icon: Bell,
    color: "text-primary" as const,
    glow: "soc-glow-primary",
  },
];

const KpiCards = () => (
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

export default KpiCards;
