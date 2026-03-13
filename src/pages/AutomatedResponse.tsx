import { Zap, Play, CheckCircle, Clock, ShieldAlert } from "lucide-react";

const playbooks = [
  { id: "PB-001", name: "Chặn IP độc hại", trigger: "Cảnh báo Suricata mức CAO", lastRun: "14:32:11", status: "Đã thực thi", actions: 3, target: "185.220.101.34" },
  { id: "PB-002", name: "Cô lập máy chủ bị xâm phạm", trigger: "Wazuh Mức 15+", lastRun: "14:33:02", status: "Đã thực thi", actions: 5, target: "web-server-01" },
  { id: "PB-003", name: "Quy trình phản ứng Log4j", trigger: "Chữ ký: Log4j RCE", lastRun: "14:31:45", status: "Đã thực thi", actions: 7, target: "10.0.2.8" },
  { id: "PB-004", name: "Ngăn chặn Rootkit", trigger: "Phát hiện rootkit Wazuh", lastRun: "14:32:18", status: "Chờ phê duyệt", actions: 4, target: "db-server-02" },
  { id: "PB-005", name: "Gián đoạn kênh C2", trigger: "Beacon CobaltStrike", lastRun: "14:30:22", status: "Đã thực thi", actions: 6, target: "91.219.236.174" },
  { id: "PB-006", name: "Cập nhật danh sách chặn Tor", trigger: "Nguồn tình báo đe dọa", lastRun: "14:15:00", status: "Đã lên lịch", actions: 2, target: "Tường lửa toàn cục" },
];

const statusStyle: Record<string, { color: string; Icon: typeof CheckCircle }> = {
  "Đã thực thi": { color: "text-success", Icon: CheckCircle },
  "Chờ phê duyệt": { color: "text-warning", Icon: Clock },
  "Đã lên lịch": { color: "text-info", Icon: Clock },
};

const AutomatedResponse = () => (
  <div className="space-y-4">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
      <Zap className="h-4 w-4" />
      Phản ứng sự cố tự động
    </h2>

    <div className="grid grid-cols-3 gap-4">
      <div className="soc-card soc-glow-accent">
        <div className="flex items-center gap-2 mb-1">
          <Play className="h-4 w-4 text-success" />
          <span className="text-xs font-mono text-muted-foreground uppercase">Đã thực thi</span>
        </div>
        <p className="text-2xl font-bold font-mono text-success">
          {playbooks.filter((p) => p.status === "Đã thực thi").length}
        </p>
      </div>
      <div className="soc-card soc-glow-primary">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-warning" />
          <span className="text-xs font-mono text-muted-foreground uppercase">Chờ phê duyệt</span>
        </div>
        <p className="text-2xl font-bold font-mono text-warning">
          {playbooks.filter((p) => p.status === "Chờ phê duyệt").length}
        </p>
      </div>
      <div className="soc-card soc-glow-accent">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-4 w-4 text-info" />
          <span className="text-xs font-mono text-muted-foreground uppercase">Đã lên lịch</span>
        </div>
        <p className="text-2xl font-bold font-mono text-info">
          {playbooks.filter((p) => p.status === "Đã lên lịch").length}
        </p>
      </div>
    </div>

    <div className="soc-card">
      <div className="overflow-auto max-h-[500px]">
        <table className="soc-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Kịch bản phản ứng</th>
              <th>Kích hoạt bởi</th>
              <th>Mục tiêu</th>
              <th>Hành động</th>
              <th>Trạng thái</th>
              <th>Lần chạy cuối</th>
            </tr>
          </thead>
          <tbody>
            {playbooks.map((pb) => {
              const { color, Icon } = statusStyle[pb.status] || statusStyle["Đã thực thi"];
              return (
                <tr key={pb.id}>
                  <td className="text-primary font-semibold">{pb.id}</td>
                  <td className="text-foreground">{pb.name}</td>
                  <td className="text-muted-foreground max-w-[200px] truncate">{pb.trigger}</td>
                  <td className="text-accent">{pb.target}</td>
                  <td className="text-muted-foreground">{pb.actions}</td>
                  <td>
                    <span className={`flex items-center gap-1 text-xs font-mono ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {pb.status}
                    </span>
                  </td>
                  <td className="text-muted-foreground whitespace-nowrap">{pb.lastRun}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AutomatedResponse;
