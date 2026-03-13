import { ShieldBan } from "lucide-react";
import { blockedIPs } from "@/data/mockData";

const BlockedIPList = () => (
  <div className="soc-card">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
      <ShieldBan className="h-4 w-4" />
      Blocked IPs
    </h2>
    <div className="space-y-2 max-h-[280px] overflow-auto">
      {blockedIPs.map((entry) => (
        <div
          key={entry.ip}
          className="flex items-center justify-between py-2 px-3 rounded bg-secondary/40 border border-border"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-danger">{entry.ip}</span>
            <span className="soc-badge bg-muted text-muted-foreground">{entry.source}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-mono">{entry.reason}</span>
            <span className="text-xs font-mono text-primary">{entry.hits.toLocaleString()} hits</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default BlockedIPList;
