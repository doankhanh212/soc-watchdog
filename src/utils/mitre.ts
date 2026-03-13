import type { MitreTechnique } from "@/api/mitreApi";
import type {
  MitreAttackChainEvent,
  MitreMatrixTactic,
  MitreMatrixTechnique,
} from "@/services/wazuhApi";

export const MITRE_TACTICS = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Exfiltration",
  "Impact",
] as const;

/** Map from canonical English tactic name → Vietnamese label shown in the UI. */
export const TACTIC_VI: Record<(typeof MITRE_TACTICS)[number], string> = {
  "Initial Access":       "Đảm nhập hệ thống",
  "Execution":            "Thực thi mã",
  "Persistence":          "Duy trì truy cập",
  "Privilege Escalation": "Nâng quyền hạn",
  "Defense Evasion":      "Trốn tránh phòng thủ",
  "Credential Access":    "Đánh cắp thông tin xác thực",
  "Discovery":            "Khám phá hệ thống",
  "Lateral Movement":     "Di chuyển ngang",
  "Collection":           "Thu thập dữ liệu",
  "Exfiltration":         "Rò rỉ dữ liệu",
  "Impact":               "Tác động hệ thống",
};

/** Return the Vietnamese tactic label for any known tactic value (English key or Vietnamese). */
export function tacticToVi(value: string): string {
  const normalized = normalizeMitreTactic(value);
  const match = MITRE_TACTICS.find((t) => normalizeMitreTactic(t) === normalized) as
    | (typeof MITRE_TACTICS)[number]
    | undefined;
  if (match) return TACTIC_VI[match];
  // If already a Vietnamese label, return as-is
  const viValues = Object.values(TACTIC_VI);
  if (viValues.includes(value as any)) return value;
  return value;
}

export interface EnrichedMitreTechnique extends MitreMatrixTechnique {
  name: string;
  description: string;
  tacticLabel: string;
  url: string;
  coverage: number;
}

export interface EnrichedMitreTactic extends Omit<MitreMatrixTactic, "tactic" | "techniques"> {
  tactic: string;
  techniques: EnrichedMitreTechnique[];
}

export interface MitreChainStep {
  tactic: string;
  techniqueId: string;
  techniqueName: string;
  timestamp: string;
  level: number;
  count: number;
  host: string;
  srcIp: string;
  description: string;
}

export function normalizeMitreTactic(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

export function resolveMitreTacticLabel(value: string): string {
  const normalized = normalizeMitreTactic(value);
  return MITRE_TACTICS.find((item) => normalizeMitreTactic(item) === normalized) ?? value;
}

export function buildMitreCatalogMap(catalog: MitreTechnique[]): Map<string, MitreTechnique> {
  return new Map(catalog.map((item) => [item.id, item]));
}

export function enrichMitreTactics(
  tactics: MitreMatrixTactic[],
  catalogMap: Map<string, MitreTechnique>,
): EnrichedMitreTactic[] {
  return MITRE_TACTICS.map((label) => {
    const matches = tactics.filter((tactic) => normalizeMitreTactic(tactic.tactic) === normalizeMitreTactic(label));
    const techniqueMap = new Map<string, MitreMatrixTechnique>();

    matches.forEach((tactic) => {
      tactic.techniques.forEach((technique) => {
        const existing = techniqueMap.get(technique.id);
        if (existing) {
          techniqueMap.set(technique.id, {
            ...existing,
            alertCount: existing.alertCount + technique.alertCount,
            maxSeverity: Math.max(existing.maxSeverity, technique.maxSeverity),
            topHost: existing.alertCount >= technique.alertCount ? existing.topHost : technique.topHost,
          });
          return;
        }

        techniqueMap.set(technique.id, {
          ...technique,
          tactic: label,
        });
      });
    });

    const techniques = Array.from(techniqueMap.values()).sort(
      (a, b) => b.alertCount - a.alertCount || b.maxSeverity - a.maxSeverity,
    );
    const maxCount = techniques[0]?.alertCount ?? 0;

    return {
      tactic: label,
      totalAlerts: techniques.reduce((sum, item) => sum + item.alertCount, 0),
      techniques: techniques.map((technique) => {
        const metadata = catalogMap.get(technique.id);
        return {
          ...technique,
          name: metadata?.name ?? technique.id,
          description: metadata?.description ?? "No MITRE catalog description available.",
          tacticLabel: label,
          url: metadata?.url ?? "",
          coverage: maxCount > 0 ? technique.alertCount / maxCount : 0,
        };
      }),
    };
  });
}

export function deriveAttackChain(
  events: MitreAttackChainEvent[],
  catalogMap: Map<string, MitreTechnique>,
): MitreChainStep[] {
  const ordered = [...events]
    .filter((event) => MITRE_TACTICS.some((item) => normalizeMitreTactic(item) === normalizeMitreTactic(event.tactic)))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const chain: MitreChainStep[] = [];

  ordered.forEach((event) => {
    const tactic = resolveMitreTacticLabel(event.tactic);
    const technique = catalogMap.get(event.techniqueId);
    const last = chain[chain.length - 1];

    if (last && last.tactic === tactic) {
      last.count += 1;
      last.level = Math.max(last.level, event.level);
      return;
    }

    chain.push({
      tactic,
      techniqueId: event.techniqueId,
      techniqueName: technique?.name ?? event.techniqueId,
      timestamp: event.timestamp,
      level: event.level,
      count: 1,
      host: event.host,
      srcIp: event.srcIp,
      description: event.description,
    });
  });

  return chain.slice(-6);
}

export function getHeatTone(coverage: number): string {
  if (coverage >= 0.66) {
    return "border-danger/60 bg-[linear-gradient(135deg,rgba(250,204,21,0.18),rgba(239,68,68,0.34))] shadow-[0_10px_30px_rgba(239,68,68,0.18)]";
  }
  if (coverage >= 0.33) {
    return "border-warning/60 bg-[linear-gradient(135deg,rgba(56,189,248,0.08),rgba(250,204,21,0.20))] shadow-[0_10px_24px_rgba(250,204,21,0.14)]";
  }
  return "border-info/40 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(15,23,42,0.5))] shadow-[0_10px_24px_rgba(34,211,238,0.10)]";
}

export function formatMitreTime(value: string): string {
  if (!value) return "Unknown";

  try {
    return new Date(value).toLocaleString("vi-VN", {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}