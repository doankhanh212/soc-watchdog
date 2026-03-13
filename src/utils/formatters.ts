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
