import type { MitreEntry } from "@/services/wazuhApi";

const getIntensity = (count: number) => {
  if (count >= 50) return "bg-danger text-danger-foreground";
  if (count >= 20) return "bg-warning/80 text-warning-foreground";
  if (count >= 10) return "bg-primary/60 text-primary-foreground";
  if (count >= 5)  return "bg-primary/30 text-foreground";
  return "bg-secondary text-muted-foreground";
};

interface Props {
  mitreData: MitreEntry[];
  loading?:  boolean;
}

const MitreHeatmap = ({ mitreData, loading }: Props) => (
  <div className="soc-card">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3">
      Bản đồ MITRE ATT&amp;CK
    </h2>
    <div className="space-y-3 max-h-[320px] overflow-auto">
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-24 bg-secondary rounded animate-pulse mb-2" />
              <div className="flex gap-1.5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-6 w-14 bg-secondary rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : mitreData.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground text-center py-4">
          Không có dữ liệu MITRE ATT&CK
        </p>
      ) : (
        mitreData.map((tactic) => (
          <div key={tactic.tactic}>
            <p className="text-xs text-muted-foreground font-mono uppercase mb-1.5">{tactic.tactic}</p>
            <div className="flex flex-wrap gap-1.5">
              {tactic.techniques.map((t) => (
                <div
                  key={t.id}
                  className={`px-2 py-1 rounded text-xs font-mono ${getIntensity(t.count)} cursor-default`}
                  title={`${t.name} — ${t.count} phát hiện`}
                >
                  {t.id} <span className="opacity-70">({t.count})</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default MitreHeatmap;
