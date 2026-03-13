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

export interface WazuhAlert {
  id: string;
  timestamp: string;
  level: number;
  rule: string;
  agent: string;
  description: string;
  mitreTactic: string;
  mitreId: string;
}

export interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: string;
  source: string;
  hits: number;
}

export interface AttackTimelinePoint {
  time: string;
  suricata: number;
  wazuh: number;
  blocked: number;
}

export interface MitreEntry {
  tactic: string;
  techniques: { id: string; name: string; count: number }[];
}

export const kpiData = {
  activeAttacks: 23,
  topAttackerIp: "185.220.101.34",
  topAttackerHits: 1847,
  blockedIps: 156,
  totalAlerts: 4291,
  criticalAlerts: 38,
};

export const suricataAlerts: SuricataAlert[] = [
  { id: "SUR-001", timestamp: "2026-03-13 14:32:11", severity: 1, signature: "ET SCAN Potential SSH Scan", srcIp: "185.220.101.34", destIp: "10.0.1.15", protocol: "TCP", category: "Attempted Information Leak" },
  { id: "SUR-002", timestamp: "2026-03-13 14:31:45", severity: 1, signature: "ET EXPLOIT Apache Log4j RCE", srcIp: "45.155.205.233", destIp: "10.0.2.8", protocol: "TCP", category: "Attempted Admin Privilege Gain" },
  { id: "SUR-003", timestamp: "2026-03-13 14:30:22", severity: 2, signature: "ET MALWARE CobaltStrike Beacon", srcIp: "91.219.236.174", destIp: "10.0.1.22", protocol: "TCP", category: "A Network Trojan was Detected" },
  { id: "SUR-004", timestamp: "2026-03-13 14:29:58", severity: 2, signature: "ET POLICY Outbound DNS Query to DynDNS", srcIp: "10.0.3.5", destIp: "8.8.8.8", protocol: "UDP", category: "Potentially Bad Traffic" },
  { id: "SUR-005", timestamp: "2026-03-13 14:28:14", severity: 3, signature: "ET SCAN Nmap SYN Scan", srcIp: "185.220.101.34", destIp: "10.0.1.1", protocol: "TCP", category: "Attempted Information Leak" },
  { id: "SUR-006", timestamp: "2026-03-13 14:27:01", severity: 1, signature: "ET EXPLOIT Possible SQL Injection", srcIp: "103.75.201.44", destIp: "10.0.2.12", protocol: "TCP", category: "Web Application Attack" },
  { id: "SUR-007", timestamp: "2026-03-13 14:25:33", severity: 2, signature: "ET MALWARE Win32/Emotet Activity", srcIp: "10.0.1.45", destIp: "198.51.100.22", protocol: "TCP", category: "A Network Trojan was Detected" },
];

export const wazuhAlerts: WazuhAlert[] = [
  { id: "WAZ-001", timestamp: "2026-03-13 14:33:02", level: 15, rule: "5712", agent: "web-server-01", description: "SSHD brute force attack detected", mitreTactic: "Credential Access", mitreId: "T1110" },
  { id: "WAZ-002", timestamp: "2026-03-13 14:32:18", level: 12, rule: "87901", agent: "db-server-02", description: "Rootkit detection: Hidden process found", mitreTactic: "Defense Evasion", mitreId: "T1014" },
  { id: "WAZ-003", timestamp: "2026-03-13 14:31:55", level: 10, rule: "550", agent: "fw-edge-01", description: "Integrity check: File modified /etc/passwd", mitreTactic: "Persistence", mitreId: "T1098" },
  { id: "WAZ-004", timestamp: "2026-03-13 14:30:44", level: 13, rule: "100200", agent: "app-server-03", description: "Privilege escalation attempt detected", mitreTactic: "Privilege Escalation", mitreId: "T1068" },
  { id: "WAZ-005", timestamp: "2026-03-13 14:29:11", level: 8, rule: "5502", agent: "web-server-02", description: "New user account created", mitreTactic: "Persistence", mitreId: "T1136" },
  { id: "WAZ-006", timestamp: "2026-03-13 14:28:30", level: 14, rule: "92001", agent: "endpoint-15", description: "Suspicious PowerShell execution", mitreTactic: "Execution", mitreId: "T1059.001" },
];

export const blockedIPs: BlockedIP[] = [
  { ip: "185.220.101.34", reason: "SSH Brute Force", blockedAt: "2026-03-13 13:45:00", source: "Suricata", hits: 1847 },
  { ip: "45.155.205.233", reason: "Log4j Exploit Attempt", blockedAt: "2026-03-13 12:22:00", source: "Wazuh", hits: 342 },
  { ip: "91.219.236.174", reason: "C2 Communication", blockedAt: "2026-03-13 11:58:00", source: "Suricata", hits: 89 },
  { ip: "103.75.201.44", reason: "SQL Injection", blockedAt: "2026-03-13 10:15:00", source: "WAF", hits: 256 },
  { ip: "23.129.64.210", reason: "Tor Exit Node", blockedAt: "2026-03-13 09:30:00", source: "Threat Intel", hits: 44 },
  { ip: "194.26.192.77", reason: "Port Scanning", blockedAt: "2026-03-13 08:12:00", source: "Suricata", hits: 512 },
  { ip: "62.102.148.68", reason: "Malware Distribution", blockedAt: "2026-03-13 07:45:00", source: "Wazuh", hits: 178 },
  { ip: "5.188.86.114", reason: "DDoS Source", blockedAt: "2026-03-13 06:20:00", source: "Firewall", hits: 3201 },
];

export const attackTimeline: AttackTimelinePoint[] = [
  { time: "00:00", suricata: 12, wazuh: 8, blocked: 3 },
  { time: "02:00", suricata: 8, wazuh: 5, blocked: 2 },
  { time: "04:00", suricata: 15, wazuh: 11, blocked: 5 },
  { time: "06:00", suricata: 22, wazuh: 14, blocked: 8 },
  { time: "08:00", suricata: 45, wazuh: 28, blocked: 12 },
  { time: "10:00", suricata: 67, wazuh: 42, blocked: 18 },
  { time: "12:00", suricata: 89, wazuh: 55, blocked: 24 },
  { time: "14:00", suricata: 112, wazuh: 71, blocked: 31 },
];

export const mitreData: MitreEntry[] = [
  { tactic: "Initial Access", techniques: [{ id: "T1190", name: "Exploit Public-Facing App", count: 34 }, { id: "T1133", name: "External Remote Services", count: 12 }] },
  { tactic: "Execution", techniques: [{ id: "T1059.001", name: "PowerShell", count: 28 }, { id: "T1059.003", name: "Windows CMD", count: 15 }] },
  { tactic: "Persistence", techniques: [{ id: "T1098", name: "Account Manipulation", count: 8 }, { id: "T1136", name: "Create Account", count: 5 }] },
  { tactic: "Privilege Escalation", techniques: [{ id: "T1068", name: "Exploitation for Priv Esc", count: 19 }] },
  { tactic: "Defense Evasion", techniques: [{ id: "T1014", name: "Rootkit", count: 3 }, { id: "T1070", name: "Indicator Removal", count: 11 }] },
  { tactic: "Credential Access", techniques: [{ id: "T1110", name: "Brute Force", count: 67 }, { id: "T1003", name: "OS Credential Dumping", count: 4 }] },
  { tactic: "Lateral Movement", techniques: [{ id: "T1021", name: "Remote Services", count: 9 }] },
  { tactic: "Command & Control", techniques: [{ id: "T1071", name: "Application Layer Protocol", count: 22 }, { id: "T1105", name: "Ingress Tool Transfer", count: 7 }] },
  { tactic: "Exfiltration", techniques: [{ id: "T1041", name: "Exfil Over C2 Channel", count: 2 }] },
];
