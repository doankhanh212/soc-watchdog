export interface MitreTechnique {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  url: string;
}

const MITRE_ATTACK_URL = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json";

let cachedTechniques: MitreTechnique[] | null = null;

export async function fetchMitreAttackData(): Promise<MitreTechnique[]> {
  if (cachedTechniques) return cachedTechniques;

  const res = await fetch(MITRE_ATTACK_URL);
  if (!res.ok) throw new Error(`MITRE ATT&CK fetch error: ${res.status}`);

  const data = await res.json();
  const techniques: MitreTechnique[] = data.objects
    .filter((obj: Record<string, unknown>) => obj.type === "attack-pattern" && !obj.revoked)
    .map((obj: Record<string, unknown>) => ({
      id: (obj.external_references as Array<{ source_name: string; external_id: string }>)
        ?.find((r) => r.source_name === "mitre-attack")?.external_id ?? "",
      name: obj.name as string,
      description: ((obj.description as string) ?? "").slice(0, 200),
      tactics: ((obj.kill_chain_phases as Array<{ phase_name: string }>) ?? []).map((p) => p.phase_name),
      url: (obj.external_references as Array<{ source_name: string; url?: string }>)
        ?.find((r) => r.source_name === "mitre-attack")?.url ?? "",
    }))
    .filter((t: MitreTechnique) => t.id);

  cachedTechniques = techniques;
  return techniques;
}

export function mapAlertToMitre(mitreId: string, techniques: MitreTechnique[]): MitreTechnique | undefined {
  return techniques.find((t) => t.id === mitreId);
}
