import { wazuhAlerts } from "@/data/mockData";

const levelColor = (level: number) => {
  if (level >= 14) return "bg-danger/20 text-danger";
  if (level >= 10) return "bg-warning/20 text-warning";
  return "bg-info/20 text-info";
};

const WazuhAlerts = () => (
  <div className="soc-card">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3">
      Wazuh Detections
    </h2>
    <div className="overflow-auto max-h-[320px]">
      <table className="soc-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Level</th>
            <th>Agent</th>
            <th>Description</th>
            <th>MITRE</th>
          </tr>
        </thead>
        <tbody>
          {wazuhAlerts.map((a) => (
            <tr key={a.id}>
              <td className="text-muted-foreground whitespace-nowrap">{a.timestamp.split(" ")[1]}</td>
              <td><span className={`soc-badge ${levelColor(a.level)}`}>{a.level}</span></td>
              <td className="text-accent">{a.agent}</td>
              <td className="text-foreground max-w-[260px] truncate">{a.description}</td>
              <td>
                <span className="soc-badge bg-secondary text-primary">{a.mitreId}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default WazuhAlerts;
