import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MitreEntry } from "@/services/wazuhApi";

interface Props {
  mitreData: MitreEntry[];
  loading?: boolean;
}

const getHeatmapStyle = (count: number) => {
  if (count > 100) {
    return "bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:bg-red-500/30";
  }
  if (count >= 10) {
    return "bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/20 hover:border-orange-500/50";
  }
  return "bg-secondary/10 text-muted-foreground border-transparent hover:bg-secondary/20 hover:text-foreground";
};

const MitreHeatmap = ({ mitreData, loading }: Props) => (
  <div className="soc-card h-full flex flex-col">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-4 border-b border-primary/10 pb-2">
      Bản đồ MITRE ATT&amp;CK – Heatmap Matrix
    </h2>

    {loading ? (
      <div className="flex gap-4 overflow-hidden h-full">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[180px] flex-shrink-0 space-y-3">
            <div className="h-4 w-24 bg-secondary/50 rounded animate-pulse mb-3" />
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-10 w-full bg-secondary/30 rounded border border-secondary/20 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    ) : mitreData.length === 0 ? (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs font-mono text-muted-foreground">
          Không có dữ liệu MITRE ATT&CK trong 24 giờ qua
        </p>
      </div>
    ) : (
      <TooltipProvider delayDuration={100}>
        <div className="flex-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <div className="flex gap-4 min-w-max">
            {mitreData.map((tactic) => (
              <div key={tactic.tactic} className="w-[180px] flex-shrink-0 flex flex-col gap-2">
                {/* Column Header */}
                <h3
                  className="font-mono text-[10px] uppercase font-bold text-primary/70 border-b border-primary/20 pb-1 truncate"
                  title={tactic.tactic}
                >
                  {tactic.tactic.replace(/_/g, " ")}
                </h3>

                {/* Technique Cards */}
                <div className="flex flex-col gap-2">
                  {tactic.techniques.map((t) => (
                    <Tooltip key={t.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            relative group cursor-pointer border rounded-sm px-3 py-2
                            transition-all duration-200 transform hover:scale-[1.02]
                            ${getHeatmapStyle(t.count)}
                          `}
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-mono text-xs font-bold tracking-tight">
                              {t.id}
                            </span>
                            <span className="text-[10px] font-mono opacity-80 bg-background/20 px-1 rounded">
                              {t.count > 999 ? "999+" : t.count}
                            </span>
                          </div>
                          {/* Mini progress bar for visual weight */}
                          <div className="h-0.5 w-full bg-background/10 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-current opacity-50"
                              style={{ width: `${Math.min(100, (t.count / 150) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-popover border-border text-popover-foreground max-w-[250px]">
                        <div className="space-y-1">
                          <p className="font-bold text-xs font-mono text-primary">{t.id}</p>
                          <p className="text-xs">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                            {t.count} cảnh báo liên quan
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>
    )}
  </div>
);

export default MitreHeatmap;
