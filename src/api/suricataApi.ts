export interface SuricataAlert {
  id: string;
  timestamp: string;
  severity: 1 | 2 | 3;
  signature: string;
  srcIp: string;
  destIp: string;
  protocol: string;
  category: string;
}

const SURICATA_API_URL = import.meta.env.VITE_SURICATA_API_URL || "";

export interface EveEvent {
  timestamp: string;
  event_type: string;
  src_ip: string;
  src_port: number;
  dest_ip: string;
  dest_port: number;
  proto: string;
  alert?: {
    action: string;
    gid: number;
    signature_id: number;
    rev: number;
    signature: string;
    category: string;
    severity: number;
  };
}

export function parseEveAlert(event: EveEvent, index: number): SuricataAlert {
  return {
    id: `SUR-${String(index + 1).padStart(3, "0")}`,
    timestamp: event.timestamp.replace("T", " ").slice(0, 19),
    severity: Math.min(event.alert?.severity ?? 3, 3) as 1 | 2 | 3,
    signature: event.alert?.signature ?? "Unknown",
    srcIp: event.src_ip,
    destIp: event.dest_ip,
    protocol: event.proto,
    category: event.alert?.category ?? "Unknown",
  };
}

export async function fetchSuricataAlerts(): Promise<SuricataAlert[]> {
  if (!SURICATA_API_URL) return [];

  const res = await fetch(SURICATA_API_URL);
  if (!res.ok) throw new Error(`Suricata API error: ${res.status}`);

  const events: EveEvent[] = await res.json();
  return events
    .filter((e) => e.event_type === "alert")
    .map(parseEveAlert);
}
