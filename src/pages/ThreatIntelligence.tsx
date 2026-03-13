import { Globe, Database, FileWarning, ExternalLink } from "lucide-react";

const iocFeeds = [
  { name: "AlienVault OTX", type: "IP/Tên miền", entries: 12450, lastSync: "14:30:00", status: "Hoạt động" },
  { name: "Abuse.ch URLhaus", type: "URL", entries: 8923, lastSync: "14:28:00", status: "Hoạt động" },
  { name: "Emerging Threats", type: "Chữ ký", entries: 34120, lastSync: "14:25:00", status: "Hoạt động" },
  { name: "CIRCL MISP", type: "IOC", entries: 5678, lastSync: "14:20:00", status: "Hoạt động" },
  { name: "VirusTotal", type: "Hash", entries: 2341, lastSync: "13:45:00", status: "Giới hạn tốc độ" },
];

const recentIOCs = [
  { ioc: "185.220.101.34", type: "IPv4", source: "AlienVault OTX", threat: "Nút thoát Tor / Quét SSH", confidence: 95 },
  { ioc: "45.155.205.233", type: "IPv4", source: "Emerging Threats", threat: "Hạ tầng khai thác Log4j", confidence: 99 },
  { ioc: "evil-domain.xyz", type: "Tên miền", source: "URLhaus", threat: "Phishing / Thu thập thông tin đăng nhập", confidence: 87 },
  { ioc: "d41d8cd98f00b204e9800998ecf8427e", type: "MD5", source: "VirusTotal", threat: "Trình nhỏ giọt Emotet", confidence: 92 },
  { ioc: "91.219.236.174", type: "IPv4", source: "CIRCL MISP", threat: "Hạ tầng C2 CobaltStrike", confidence: 98 },
  { ioc: "198.51.100.22", type: "IPv4", source: "AlienVault OTX", threat: "Phân phối phần mềm độc hại đã biết", confidence: 85 },
];

const confidenceColor = (c: number) => {
  if (c >= 90) return "text-danger";
  if (c >= 70) return "text-warning";
  return "text-info";
};

const ThreatIntelligence = () => (
  <div className="space-y-4">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
      <Globe className="h-4 w-4" />
      Tình báo mối đe dọa – Nguồn dữ liệu IOC
    </h2>

    <div className="grid grid-cols-5 gap-4">
      {iocFeeds.map((feed) => (
        <div key={feed.name} className="soc-card">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-mono text-foreground font-semibold truncate">{feed.name}</span>
          </div>
          <p className="text-lg font-bold font-mono text-primary">{feed.entries.toLocaleString()}</p>
          <p className="text-xs font-mono text-muted-foreground">{feed.type}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-mono text-muted-foreground">{feed.lastSync}</span>
            <span className={`soc-badge ${feed.status === "Hoạt động" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
              {feed.status}
            </span>
          </div>
        </div>
      ))}
    </div>

    <div className="soc-card">
      <h3 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
        <FileWarning className="h-4 w-4" />
        Kết quả khớp IOC gần đây
      </h3>
      <div className="overflow-auto max-h-[400px]">
        <table className="soc-table">
          <thead>
            <tr>
              <th>IOC</th>
              <th>Loại</th>
              <th>Nguồn</th>
              <th>Mối đe dọa</th>
              <th>Độ tin cậy</th>
            </tr>
          </thead>
          <tbody>
            {recentIOCs.map((ioc) => (
              <tr key={ioc.ioc}>
                <td className="text-accent">
                  <span className="flex items-center gap-1">
                    {ioc.ioc}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </span>
                </td>
                <td><span className="soc-badge bg-secondary text-foreground">{ioc.type}</span></td>
                <td className="text-muted-foreground">{ioc.source}</td>
                <td className="text-foreground max-w-[250px] truncate">{ioc.threat}</td>
                <td className={`font-bold ${confidenceColor(ioc.confidence)}`}>{ioc.confidence}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default ThreatIntelligence;
