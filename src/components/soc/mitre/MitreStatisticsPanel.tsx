import type { MitreMatrixTechnique, MitreStatItem } from "@/services/wazuhApi";
import { maucDoViPham, muccDoViPham } from "@/utils/formatters";
import { tacticToVi } from "@/utils/mitre";
import { Activity, Crosshair, ServerCrash, Sigma } from "lucide-react";

interface RankedTechnique extends MitreMatrixTechnique {
  name: string;
}

interface Props {
  totalDetections: number;
  topTechniques: RankedTechnique[];
  topTactics: MitreStatItem[];
  topHosts: MitreStatItem[];
}

const listClasses = "space-y-2";

const MitreStatisticsPanel = ({
  totalDetections,
  topTechniques,
  topTactics,
  topHosts,
}: Props) => {
  return (
    <section className="soc-card border-info/20 bg-[linear-gradient(180deg,rgba(8,47,73,0.28),rgba(15,23,42,0.9))]">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-info">
            <Sigma className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-info/80">
              Thống kê MITRE
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Đánh giá mức độ tấn công và hồ sơ mục tiêu</h2>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-right">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-primary/80">Tổng phát hiện MITRE</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{totalDetections.toLocaleString("vi-VN")}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Top kỹ thuật */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Crosshair className="h-4 w-4 text-danger" />
            Kỹ thuật xuất hiện nhiều nhất
          </div>
          <div className={listClasses}>
            {topTechniques.map((technique) => (
              <div key={`${technique.tactic}-${technique.id}`} className="rounded-xl border border-border/70 bg-secondary/10 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-[0.18em] text-primary">{technique.id}</div>
                    <p className="mt-1 text-sm font-medium text-foreground">{technique.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{tacticToVi(technique.tactic)}</p>
                  </div>
                  <span className={`soc-badge ${maucDoViPham(technique.maxSeverity)}`}>
                    {muccDoViPham(technique.maxSeverity)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono uppercase tracking-[0.18em]">Số cảnh báo</span>
                  <span className="font-mono text-foreground">{technique.alertCount.toLocaleString("vi-VN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-1">
          {/* Chiến thuật phổ biến */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Activity className="h-4 w-4 text-warning" />
              Chiến thuật phổ biến
            </div>
            <div className={listClasses}>
              {topTactics.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/10 px-3 py-2.5">
                  <span className="text-sm text-foreground">{tacticToVi(item.label)}</span>
                  <span className="font-mono text-xs text-warning">{item.count.toLocaleString("vi-VN")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Máy chủ bị tấn công */}
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <ServerCrash className="h-4 w-4 text-info" />
              Máy chủ bị tấn công nhiều nhất
            </div>
            <div className={listClasses}>
              {topHosts.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/10 px-3 py-2.5">
                  <span className="max-w-[70%] truncate text-sm text-foreground" title={item.label}>
                    {item.label}
                  </span>
                  <span className="font-mono text-xs text-info">{item.count.toLocaleString("vi-VN")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MitreStatisticsPanel;