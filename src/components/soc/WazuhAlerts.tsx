import { useEffect, useMemo, useState } from "react";
import PaginationBar from "@/components/PaginationBar";
import type { WazuhAlertDisplay } from "@/services/wazuhApi";

const levelColor = (level: number) => {
  if (level >= 14) return "bg-danger/20 text-danger";
  if (level >= 10) return "bg-warning/20 text-warning";
  return "bg-info/20 text-info";
};

const levelLabel = (level: number) => {
  if (level >= 14) return "NGHIÊM TRỌNG";
  if (level >= 10) return "CAO";
  if (level >= 7)  return "TB";
  return "THẤP";
};

const LoadingRows = () => (
  <>
    {[1, 2, 3].map((i) => (
      <tr key={i}>
        {[1, 2, 3, 4, 5].map((j) => (
          <td key={j}><div className="h-3 w-20 bg-secondary rounded animate-pulse" /></td>
        ))}
      </tr>
    ))}
  </>
);

interface Props {
  alerts:   WazuhAlertDisplay[];
  loading?: boolean;
  paginate?: boolean;
  pageSize?: number;
}

const WazuhAlerts = ({ alerts, loading, paginate = false, pageSize = 20 }: Props) => {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(alerts.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [alerts.length, pageSize]);

  const viewAlerts = useMemo(() => {
    if (!paginate) return alerts;
    const start = (page - 1) * pageSize;
    return alerts.slice(start, start + pageSize);
  }, [alerts, page, pageSize, paginate]);

  return (
    <div className="soc-card">
      <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3">
        Phát hiện từ Wazuh
      </h2>
      <div className={paginate ? "overflow-auto" : "overflow-auto max-h-[320px]"}>
        <table className="soc-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Mức cảnh báo</th>
              <th>Agent</th>
              <th>Mô tả</th>
              <th>Kỹ thuật MITRE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-4 text-xs font-mono">
                  Không có cảnh báo
                </td>
              </tr>
            ) : (
              viewAlerts.map((a) => (
                <tr key={a.id}>
                  <td className="text-muted-foreground whitespace-nowrap">{a.timestamp.split(" ")[1]}</td>
                  <td>
                    <span className={`soc-badge ${levelColor(a.level)}`}>
                      {a.level} – {levelLabel(a.level)}
                    </span>
                  </td>
                  <td className="text-accent">{a.agent}</td>
                  <td className="text-foreground max-w-[260px] truncate">{a.description}</td>
                  <td>
                    <span className="soc-badge bg-secondary text-primary">
                      {a.mitreIds[0] ?? "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginate && !loading && (
        <div className="pt-3">
          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default WazuhAlerts;
