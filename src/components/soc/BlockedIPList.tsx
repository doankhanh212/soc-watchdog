import { ShieldBan } from "lucide-react";
import type { TopAttacker } from "@/services/wazuhApi";

interface Props {
  attackers: TopAttacker[];
  loading?:  boolean;
}

const BlockedIPList = ({ attackers, loading }: Props) => (
  <div className="soc-card">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
      <ShieldBan className="h-4 w-4" />
      Danh sách IP tấn công hàng đầu
    </h2>
    <div className="space-y-2 max-h-[280px] overflow-auto">
      {loading ? (
        [1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 px-3 rounded bg-secondary/40 border border-border animate-pulse">
            <div className="h-3 w-32 bg-secondary rounded" />
            <div className="h-3 w-20 bg-secondary rounded" />
          </div>
        ))
      ) : attackers.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground text-center py-4">Không có dữ liệu</p>
      ) : (
        attackers.map((entry) => (
          <div
            key={entry.ip}
            className="flex items-center justify-between py-2 px-3 rounded bg-secondary/40 border border-border"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-danger">{entry.ip}</span>
              <span className="soc-badge bg-muted text-muted-foreground">{entry.source}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground font-mono max-w-[180px] truncate">{entry.reason}</span>
              <span className="text-xs font-mono text-primary">{entry.hits.toLocaleString()} lượt</span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default BlockedIPList;
