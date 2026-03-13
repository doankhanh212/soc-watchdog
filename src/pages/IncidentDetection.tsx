import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useWazuhData } from "@/hooks/useWazuhData";
import type { WazuhAlertDisplay } from "@/services/wazuhApi";

const statusIcon: Record<string, typeof CheckCircle> = {
  "Đang mở":       XCircle,
  "Đang điều tra": Clock,
  "Đã xử lý":      CheckCircle,
};

const statusColor: Record<string, string> = {
  "Đang mở":       "text-danger",
  "Đang điều tra": "text-warning",
  "Đã xử lý":      "text-success",
};

const sevColor: Record<string, string> = {
  "Nghiêm trọng": "bg-danger/20 text-danger",
  "Cao":           "bg-warning/20 text-warning",
  "Trung bình":    "bg-info/20 text-info",
};

function sevLabel(level: number) {
  if (level >= 14) return "Nghiêm trọng";
  if (level >= 10) return "Cao";
  return "Trung bình";
}

function deriveStatus(a: WazuhAlertDisplay, idx: number) {
  if (a.level >= 14) return idx % 2 === 0 ? "Đang mở" : "Đang điều tra";
  if (a.level >= 10) return idx % 3 === 0 ? "Đã xử lý" : "Đang mở";
  return "Đã xử lý";
}

function buildIncidents(alerts: WazuhAlertDisplay[]) {
  return alerts
    .filter((a) => a.level >= 10)
    .slice(0, 20)
    .map((a, idx) => ({
      id:       `INC-${String(idx + 1).padStart(3, "0")}`,
      title:    a.description,
      severity: sevLabel(a.level),
      status:   deriveStatus(a, idx),
      assignee: idx % 3 === 0 ? "SOC-Analyst-1" : idx % 3 === 1 ? "SOC-Analyst-2" : "Chưa phân công",
      alerts:   a.level >= 14 ? 4 + (idx % 8) : 1 + (idx % 4),
      updated:  a.timestamp.split(" ")[1] ?? a.timestamp,
    }));
}

const IncidentDetection = () => {
  const { alerts, loading, error } = useWazuhData();
  const incidents = buildIncidents(alerts);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Phát hiện sự cố &amp; Phân loại
      </h2>

      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="soc-card soc-glow-danger">
          <p className="text-xs font-mono text-muted-foreground uppercase">Đang mở</p>
          <p className="text-2xl font-bold font-mono text-danger">
            {loading ? "…" : incidents.filter((i) => i.status === "Đang mở").length}
          </p>
        </div>
        <div className="soc-card soc-glow-primary">
          <p className="text-xs font-mono text-muted-foreground uppercase">Đang điều tra</p>
          <p className="text-2xl font-bold font-mono text-warning">
            {loading ? "…" : incidents.filter((i) => i.status === "Đang điều tra").length}
          </p>
        </div>
        <div className="soc-card soc-glow-accent">
          <p className="text-xs font-mono text-muted-foreground uppercase">Đã xử lý</p>
          <p className="text-2xl font-bold font-mono text-success">
            {loading ? "…" : incidents.filter((i) => i.status === "Đã xử lý").length}
          </p>
        </div>
      </div>

      <div className="soc-card">
        <div className="overflow-auto max-h-[500px]">
          <table className="soc-table">
            <thead>
              <tr>
                <th>Mã sự cố</th>
                <th>Mức độ</th>
                <th>Trạng thái</th>
                <th>Tiêu đề</th>
                <th>Phân công</th>
                <th>Cảnh báo</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j}><div className="h-3 w-16 bg-secondary rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-4 text-xs font-mono">
                    Không có sự cố nghiêm trọng
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => {
                  const Icon = statusIcon[inc.status];
                  return (
                    <tr key={inc.id}>
                      <td className="text-primary font-semibold">{inc.id}</td>
                      <td><span className={`soc-badge ${sevColor[inc.severity]}`}>{inc.severity}</span></td>
                      <td>
                        <span className={`flex items-center gap-1 text-xs font-mono ${statusColor[inc.status]}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {inc.status}
                        </span>
                      </td>
                      <td className="text-foreground max-w-[300px] truncate">{inc.title}</td>
                      <td className="text-muted-foreground">{inc.assignee}</td>
                      <td className="text-accent">{inc.alerts}</td>
                      <td className="text-muted-foreground whitespace-nowrap">{inc.updated}</td>
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

export default IncidentDetection;
