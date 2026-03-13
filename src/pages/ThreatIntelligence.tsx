import { Globe, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { useWazuhData } from "@/hooks/useWazuhData";
import type { ThreatIntelEntry } from "@/services/wazuhApi";

const levelLabel = (lv: number) =>
  lv >= 14 ? "Nghiêm trọng" : lv >= 10 ? "Cao" : lv >= 8 ? "Trung bình" : "Thấp";

const levelBadge = (lv: number) => {
  if (lv >= 14) return "bg-danger/20 text-danger";
  if (lv >= 10) return "bg-warning/20 text-warning";
  if (lv >= 8)  return "bg-primary/20 text-primary";
  return "bg-secondary text-muted-foreground";
};

const ThreatIntelligence = () => {
  const { threatIntel, loading, error } = useWazuhData();

  const critical = threatIntel.filter((t) => t.maxLevel >= 14).length;
  const high     = threatIntel.filter((t) => t.maxLevel >= 10 && t.maxLevel < 14).length;
  const medium   = threatIntel.filter((t) => t.maxLevel >= 8 && t.maxLevel < 10).length;
  const totalHits = threatIntel.reduce((sum, t) => sum + t.hits, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Tình báo mối đe dọa – Phân tích IP nguồn (24 giờ)
        </h2>
        <span className="text-xs font-mono text-muted-foreground">
          {loading ? "…" : `${threatIntel.length} IP đe dọa · ${totalHits.toLocaleString()} cảnh báo`}
        </span>
      </div>

      {error && (
        <div className="px-4 py-2 rounded border border-danger/30 bg-danger/10 text-danger text-xs font-mono">
          <span className="font-bold">Lỗi:</span> {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="soc-card soc-glow-danger">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Nghiêm trọng</span>
          </div>
          <p className="text-2xl font-bold font-mono text-danger">{loading ? "…" : critical}</p>
        </div>
        <div className="soc-card soc-glow-primary">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-warning" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Cao</span>
          </div>
          <p className="text-2xl font-bold font-mono text-warning">{loading ? "…" : high}</p>
        </div>
        <div className="soc-card soc-glow-accent">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-info" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Trung bình</span>
          </div>
          <p className="text-2xl font-bold font-mono text-info">{loading ? "…" : medium}</p>
        </div>
        <div className="soc-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Tổng cảnh báo</span>
          </div>
          <p className="text-2xl font-bold font-mono text-primary">{loading ? "…" : totalHits.toLocaleString()}</p>
        </div>
      </div>

      <div className="soc-card">
        <div className="overflow-auto max-h-[500px]">
          <table className="soc-table">
            <thead>
              <tr>
                <th>IP nguồn</th>
                <th>Mức cao nhất</th>
                <th>Số lượt</th>
                <th>Quy tắc đại diện</th>
                <th>MITRE ATT&amp;CK</th>
                <th>Chiến thuật</th>
                <th>Phát hiện lần cuối</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j}><div className="h-3 w-16 bg-secondary rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : threatIntel.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-4 text-xs font-mono">
                    Không có IP đe dọa (level &ge; 8) trong 24 giờ qua
                  </td>
                </tr>
              ) : (
                threatIntel.map((t) => (
                  <tr key={t.ip}>
                    <td className="text-accent font-semibold">{t.ip}</td>
                    <td>
                      <span className={`soc-badge ${levelBadge(t.maxLevel)}`}>
                        {levelLabel(t.maxLevel)} ({t.maxLevel})
                      </span>
                    </td>
                    <td className="text-primary font-semibold">{t.hits.toLocaleString()}</td>
                    <td className="text-foreground max-w-[250px] truncate">{t.topRule}</td>
                    <td className="text-muted-foreground">
                      {t.mitreIds.length > 0 ? t.mitreIds.slice(0, 3).join(", ") : "—"}
                      {t.mitreIds.length > 3 && ` +${t.mitreIds.length - 3}`}
                    </td>
                    <td className="text-muted-foreground max-w-[180px] truncate">
                      {t.mitreTactics.length > 0 ? t.mitreTactics.join(", ") : "—"}
                    </td>
                    <td className="text-muted-foreground whitespace-nowrap">{t.lastSeen}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ThreatIntelligence;
