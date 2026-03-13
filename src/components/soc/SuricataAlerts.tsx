import { suricataAlerts } from "@/data/mockData";

const severityBadge = (s: 1 | 2 | 3) => {
  const styles: Record<number, string> = {
    1: "bg-danger/20 text-danger",
    2: "bg-warning/20 text-warning",
    3: "bg-info/20 text-info",
  };
  const labels: Record<number, string> = { 1: "HIGH", 2: "MED", 3: "LOW" };
  return <span className={`soc-badge ${styles[s]}`}>{labels[s]}</span>;
};

const SuricataAlerts = () => (
  <div className="soc-card">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3">
      Suricata Alerts
    </h2>
    <div className="overflow-auto max-h-[320px]">
      <table className="soc-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Sev</th>
            <th>Signature</th>
            <th>Src IP</th>
            <th>Dst IP</th>
            <th>Proto</th>
          </tr>
        </thead>
        <tbody>
          {suricataAlerts.map((a) => (
            <tr key={a.id}>
              <td className="text-muted-foreground whitespace-nowrap">{a.timestamp.split(" ")[1]}</td>
              <td>{severityBadge(a.severity)}</td>
              <td className="text-foreground max-w-[240px] truncate">{a.signature}</td>
              <td className="text-accent">{a.srcIp}</td>
              <td className="text-muted-foreground">{a.destIp}</td>
              <td className="text-muted-foreground">{a.protocol}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default SuricataAlerts;
