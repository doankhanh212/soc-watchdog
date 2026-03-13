import { Search, AlertTriangle, Eye, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PaginationBar from "@/components/PaginationBar";
import { useWazuhData } from "@/hooks/useWazuhData";
import type { WazuhAlertDisplay } from "@/services/wazuhApi";

const sevLabel = (level: number) =>
  level >= 14 ? "Nghiêm trọng" : level >= 10 ? "Cao" : "Trung bình";

const severityColor: Record<string, string> = {
  "Nghiêm trọng": "bg-danger/20 text-danger",
  "Cao":           "bg-warning/20 text-warning",
  "Trung bình":    "bg-info/20 text-info",
};

function buildThreats(alerts: WazuhAlertDisplay[]) {
  return alerts.map((a) => ({
    id:          a.id,
    time:        a.timestamp,
    source:      a.srcIp ? "Wazuh/NET" : "Wazuh/HIDS",
    severity:    sevLabel(a.level),
    description: a.description,
    ip:          a.srcIp || a.agent,
  }));
}

const ThreatMonitoring = () => {
  const { alerts, loading, error } = useWazuhData({
    needs: { alerts: true },
    limits: { alerts: 1000 },
    pollMs: 10_000,
  });

  const threats = useMemo(() => buildThreats(alerts), [alerts]);

  const stats = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    for (const t of threats) {
      if (t.severity === "Nghiêm trọng") critical++;
      else if (t.severity === "Cao") high++;
      else if (t.severity === "Trung bình") medium++;
    }
    return { critical, high, medium };
  }, [threats]);

  const pageSize = 50;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(threats.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [threats.length]);

  const viewThreats = useMemo(() => {
    const start = (page - 1) * pageSize;
    return threats.slice(start, start + pageSize);
  }, [page, threats]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Giám sát mối đe dọa – Luồng trực tiếp
        </h2>
        <div className="flex items-center gap-2 bg-secondary/50 rounded px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            {loading ? "…" : `${threats.length} mối đe dọa được phát hiện (tối đa 1.000)`}
          </span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="soc-card soc-glow-danger">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Nghiêm trọng</span>
          </div>
          <p className="text-2xl font-bold font-mono text-danger">
            {loading ? "…" : stats.critical}
          </p>
        </div>
        <div className="soc-card soc-glow-primary">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-warning" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Cao</span>
          </div>
          <p className="text-2xl font-bold font-mono text-warning">
            {loading ? "…" : stats.high}
          </p>
        </div>
        <div className="soc-card soc-glow-accent">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-info" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Trung bình</span>
          </div>
          <p className="text-2xl font-bold font-mono text-info">
            {loading ? "…" : stats.medium}
          </p>
        </div>
      </div>

      <div className="soc-card">
        <div className="overflow-auto max-h-[500px]">
          <table className="soc-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Nguồn</th>
                <th>Mức độ</th>
                <th>Mô tả</th>
                <th>Xuất phát</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j}><div className="h-3 w-20 bg-secondary rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : threats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-4 text-xs font-mono">
                    Không có dữ liệu trong 24 giờ qua
                  </td>
                </tr>
              ) : (
                viewThreats.map((t) => (
                  <tr key={t.id}>
                    <td className="text-muted-foreground whitespace-nowrap">{t.time.split(" ")[1]}</td>
                    <td><span className="soc-badge bg-secondary text-foreground">{t.source}</span></td>
                    <td><span className={`soc-badge ${severityColor[t.severity]}`}>{t.severity}</span></td>
                    <td className="text-foreground max-w-[300px] truncate">{t.description}</td>
                    <td className="text-accent">{t.ip}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && threats.length > 0 && (
          <div className="pt-3">
            <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreatMonitoring;
