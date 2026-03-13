const WAZUH_BASE_URL = import.meta.env.VITE_WAZUH_API_URL || "https://localhost:9200";
const WAZUH_USER = import.meta.env.VITE_WAZUH_USER || "admin";
const WAZUH_PASS = import.meta.env.VITE_WAZUH_PASS || "admin";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${btoa(`${WAZUH_USER}:${WAZUH_PASS}`)}`,
};

export async function fetchWazuhAlerts(params?: {
  size?: number;
  from?: number;
  level_min?: number;
}) {
  const size = params?.size ?? 50;
  const from = params?.from ?? 0;
  const query: Record<string, unknown> = {
    size,
    from,
    sort: [{ timestamp: { order: "desc" } }],
    query: {
      bool: {
        must: [
          { range: { "rule.level": { gte: params?.level_min ?? 3 } } },
        ],
      },
    },
  };

  const res = await fetch(`${WAZUH_BASE_URL}/wazuh-alerts-*/_search`, {
    method: "POST",
    headers,
    body: JSON.stringify(query),
  });

  if (!res.ok) throw new Error(`Wazuh API error: ${res.status}`);
  return res.json();
}

export async function fetchWazuhAgents() {
  const res = await fetch(`${WAZUH_BASE_URL}/wazuh-agents/_search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ size: 100, query: { match_all: {} } }),
  });

  if (!res.ok) throw new Error(`Wazuh API error: ${res.status}`);
  return res.json();
}
