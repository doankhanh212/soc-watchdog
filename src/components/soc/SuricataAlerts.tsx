import { useEffect, useMemo, useState } from "react";
import PaginationBar from "@/components/PaginationBar";
import type { WazuhAlertDisplay } from "@/services/wazuhApi";

const toSev = (level: number): 1 | 2 | 3 =>
  level >= 10 ? 1 : level >= 5 ? 2 : 3;

const severityBadge = (s: 1 | 2 | 3) => {
  const styles: Record<number, string> = {
    1: "bg-danger/20 text-danger",
    2: "bg-warning/20 text-warning",
    3: "bg-info/20 text-info",
  };
  const labels: Record<number, string> = { 1: "CAO", 2: "TB", 3: "THẤP" };
  return <span className={`soc-badge ${styles[s]}`}>{labels[s]}</span>;
};

const LoadingRows = () => (
  <>
    {[1, 2, 3].map((i) => (
      <tr key={i}>
        {[1, 2, 3, 4, 5, 6].map((j) => (
          <td key={j}><div className="h-3 w-16 bg-secondary rounded animate-pulse" /></td>
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

const SuricataAlerts = ({ alerts, loading, paginate = false, pageSize = 20 }: Props) => {
  const netAlerts = useMemo(() => alerts.filter((a) => a.srcIp !== ""), [alerts]);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(netAlerts.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [netAlerts.length, pageSize]);

  const viewAlerts = useMemo(() => {
    if (!paginate) return netAlerts;
    const start = (page - 1) * pageSize;
    return netAlerts.slice(start, start + pageSize);
  }, [netAlerts, page, pageSize, paginate]);

  return (
    <div className="soc-card">
      <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3">
        Cảnh báo mạng / IDS
      </h2>
      <div className={paginate ? "overflow-auto" : "overflow-auto max-h-[320px]"}>
        <table className="soc-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Mức độ</th>
              <th>Chữ ký tấn công</th>
              <th>IP nguồn</th>
              <th>IP đích</th>
              <th>Giao thức</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : netAlerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted-foreground py-4 text-xs font-mono">
                  Không có cảnh báo mạng
                </td>
              </tr>
            ) : (
              viewAlerts.map((a) => (
                <tr key={a.id}>
                  <td className="text-muted-foreground whitespace-nowrap">{a.timestamp.split(" ")[1]}</td>
                  <td>{severityBadge(toSev(a.level))}</td>
                  <td className="text-foreground max-w-[240px] truncate">{a.description}</td>
                  <td className="text-accent">{a.srcIp}</td>
                  <td className="text-muted-foreground">{a.destIp || "—"}</td>
                  <td className="text-muted-foreground">{a.protocol || "—"}</td>
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

export default SuricataAlerts;
