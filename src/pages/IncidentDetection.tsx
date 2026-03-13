import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PaginationBar from "@/components/PaginationBar";
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
  "Thấp":          "bg-secondary text-muted-foreground",
};

function sevLabel(level: number) {
  if (level >= 14) return "Nghiêm trọng";
  if (level >= 10) return "Cao";
  if (level >= 5)  return "Trung bình";
  return "Thấp";
}

// Status derived purely from rule level — no fake index cycling
function deriveStatus(level: number): string {
  if (level >= 14) return "Đang mở";
  if (level >= 10) return "Đang điều tra";
  return "Đã xử lý";
}

function buildIncidents(alerts: WazuhAlertDisplay[]) {
  return alerts
    .filter((a) => a.level >= 5)
    .map((a, idx) => ({
      id:       `INC-${String(idx + 1).padStart(4, "0")}`,
      title:    a.description,
      severity: sevLabel(a.level),
      status:   deriveStatus(a.level),
      // Real agent hostname from Wazuh — not a fake analyst name
      agent:    a.agent || "—",
      ruleId:   a.ruleId,
      srcIp:    a.srcIp || "—",
      updated:  a.timestamp,
    }));
}

const IncidentDetection = () => {
  const { alerts, loading, error } = useWazuhData({
    needs: { alerts: true },
    limits: { alerts: 1000 },
    pollMs: 30_000,
  });

  const incidents = useMemo(() => buildIncidents(alerts), [alerts]);

  const stats = useMemo(() => {
    let open = 0;
    let investigating = 0;
    let done = 0;
    for (const i of incidents) {
      if (i.status === "Đang mở") open++;
      else if (i.status === "Đang điều tra") investigating++;
      else done++;
    }
    return { open, investigating, done };
  }, [incidents]);

  const pageSize = 50;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(incidents.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [incidents.length]);

  const viewIncidents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return incidents.slice(start, start + pageSize);
  }, [incidents, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Phát hiện sự cố &amp; Phân loại – 24 giờ qua
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {loading ? "…" : `${incidents.length} sự cố (tối đa 1.000)`}
        </span>
      </div>

      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="soc-card soc-glow-danger">
          <p className="text-xs font-mono text-muted-foreground uppercase">Đang mở</p>
          <p className="text-2xl font-bold font-mono text-danger">
            {loading ? "…" : stats.open}
          </p>
        </div>
        <div className="soc-card soc-glow-primary">
          <p className="text-xs font-mono text-muted-foreground uppercase">Đang điều tra</p>
          <p className="text-2xl font-bold font-mono text-warning">
            {loading ? "…" : stats.investigating}
          </p>
        </div>
        <div className="soc-card soc-glow-accent">
          <p className="text-xs font-mono text-muted-foreground uppercase">Đã xử lý</p>
          <p className="text-2xl font-bold font-mono text-success">
            {loading ? "…" : stats.done}
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
                <th>Mô tả</th>
                <th>Agent</th>
                <th>Rule ID</th>
                <th>IP nguồn</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                      <td key={j}><div className="h-3 w-16 bg-secondary rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground py-4 text-xs font-mono">
                    Không có sự cố (level ≥ 5) trong 24 giờ qua
                  </td>
                </tr>
              ) : (
                viewIncidents.map((inc) => {
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
                      <td className="text-foreground max-w-[260px] truncate">{inc.title}</td>
                      <td className="text-muted-foreground">{inc.agent}</td>
                      <td className="text-muted-foreground">{inc.ruleId}</td>
                      <td className="text-accent">{inc.srcIp}</td>
                      <td className="text-muted-foreground whitespace-nowrap">{inc.updated}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && incidents.length > 0 && (
          <div className="pt-3">
            <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentDetection;
