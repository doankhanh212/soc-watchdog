import { Zap, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { useWazuhData } from "@/hooks/useWazuhData";
import type { WazuhAlertDisplay } from "@/services/wazuhApi";

function actionLabel(a: WazuhAlertDisplay) {
  const g = a.ruleGroups;
  if (g.includes("firewall-drop")) return "Chặn IP (firewall-drop)";
  if (g.includes("host-deny"))     return "Từ chối truy cập (host-deny)";
  if (g.includes("active-response")) return "Active Response";
  return "Phản ứng tự động";
}

function statusFromLevel(level: number) {
  if (level >= 12) return { label: "Nghiêm trọng", color: "text-danger",  Icon: ShieldOff };
  if (level >= 8)  return { label: "Đã thực thi",  color: "text-success", Icon: ShieldCheck };
  return               { label: "Đã thực thi",  color: "text-success", Icon: ShieldCheck };
}

const AutomatedResponse = () => {
  const { activeResponses, loading, error } = useWazuhData();

  const criticalCount = activeResponses.filter((a) => a.level >= 12).length;
  const highCount     = activeResponses.filter((a) => a.level >= 8 && a.level < 12).length;
  const normalCount   = activeResponses.filter((a) => a.level < 8).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Phản ứng sự cố tự động – 24 giờ qua
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {loading ? "…" : `${activeResponses.length} sự kiện phản ứng`}
        </span>
      </div>

      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="soc-card soc-glow-danger">
          <div className="flex items-center gap-2 mb-1">
            <ShieldOff className="h-4 w-4 text-danger" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Nghiêm trọng</span>
          </div>
          <p className="text-2xl font-bold font-mono text-danger">
            {loading ? "…" : criticalCount}
          </p>
        </div>
        <div className="soc-card soc-glow-primary">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Mức cao</span>
          </div>
          <p className="text-2xl font-bold font-mono text-warning">
            {loading ? "…" : highCount}
          </p>
        </div>
        <div className="soc-card soc-glow-accent">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Bình thường</span>
          </div>
          <p className="text-2xl font-bold font-mono text-success">
            {loading ? "…" : normalCount}
          </p>
        </div>
      </div>

      <div className="soc-card">
        <div className="overflow-auto max-h-[500px]">
          <table className="soc-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Hành động</th>
                <th>IP nguồn</th>
                <th>Mô tả quy tắc</th>
                <th>Agent</th>
                <th>Mức</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j}><div className="h-3 w-16 bg-secondary rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : activeResponses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-4 text-xs font-mono">
                    Không có sự kiện Active Response trong 24 giờ qua
                  </td>
                </tr>
              ) : (
                activeResponses.map((a) => {
                  const st = statusFromLevel(a.level);
                  return (
                    <tr key={a.id}>
                      <td className="text-muted-foreground whitespace-nowrap">{a.timestamp}</td>
                      <td><span className="soc-badge bg-accent/20 text-accent">{actionLabel(a)}</span></td>
                      <td className="text-accent">{a.srcIp || "—"}</td>
                      <td className="text-foreground max-w-[280px] truncate">{a.description}</td>
                      <td className="text-muted-foreground">{a.agent}</td>
                      <td className="text-primary font-semibold">{a.level}</td>
                      <td>
                        <span className={`flex items-center gap-1 text-xs font-mono ${st.color}`}>
                          <st.Icon className="h-3.5 w-3.5" />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AutomatedResponse;
