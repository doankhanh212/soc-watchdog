export function formatTimestamp(iso: string): string {
  return iso.replace("T", " ").slice(0, 19);
}

export function severityLabel(level: number): string {
  if (level >= 14) return "Critical";
  if (level >= 10) return "High";
  if (level >= 7) return "Medium";
  return "Low";
}

export function severityColor(level: number): string {
  if (level >= 14) return "bg-danger/20 text-danger";
  if (level >= 10) return "bg-warning/20 text-warning";
  if (level >= 7) return "bg-info/20 text-info";
  return "bg-secondary text-muted-foreground";
}

// ── Vietnamese severity helpers (for MITRE and SOC pages) ─────────────────────

export function muccDoViPham(level: number): string {
  if (level >= 14) return "Nghiêm trọng";
  if (level >= 10) return "Cao";
  if (level >= 7)  return "Trung bình";
  return "Thấp";
}

export function maucDoViPham(level: number): string {
  if (level >= 14) return "bg-danger/20 text-danger border border-danger/30";
  if (level >= 10) return "bg-warning/20 text-warning border border-warning/30";
  if (level >= 7)  return "bg-info/20 text-info border border-info/30";
  return "bg-secondary text-muted-foreground border border-border/60";
}
