export type AttackSeverityKey = "low" | "medium" | "high" | "critical";

export interface AttackSeverityMeta {
  key: AttackSeverityKey;
  label: string;
  color: string;
  glow: string;
  badgeClass: string;
}

const SEVERITY_META: Record<AttackSeverityKey, AttackSeverityMeta> = {
  low: {
    key: "low",
    label: "Low",
    color: "#38bdf8",
    glow: "rgba(56, 189, 248, 0.45)",
    badgeClass: "bg-info/20 text-info border border-info/30",
  },
  medium: {
    key: "medium",
    label: "Medium",
    color: "#facc15",
    glow: "rgba(250, 204, 21, 0.45)",
    badgeClass: "bg-warning/20 text-warning border border-warning/30",
  },
  high: {
    key: "high",
    label: "High",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.5)",
    badgeClass: "bg-danger/20 text-danger border border-danger/30",
  },
  critical: {
    key: "critical",
    label: "Critical",
    color: "#ff3b3b",
    glow: "rgba(255, 59, 59, 0.7)",
    badgeClass: "animate-pulse bg-danger/25 text-danger border border-danger/50 shadow-[0_0_14px_rgba(255,59,59,0.45)]",
  },
};

export function getAttackSeverity(level: number): AttackSeverityMeta {
  if (level >= 14) return SEVERITY_META.critical;
  if (level >= 10) return SEVERITY_META.high;
  if (level >= 7) return SEVERITY_META.medium;
  return SEVERITY_META.low;
}

export function formatAttackTime(timestamp: string): string {
  if (!timestamp) return "Unknown";

  try {
    return new Date(timestamp).toLocaleString("vi-VN", {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
}