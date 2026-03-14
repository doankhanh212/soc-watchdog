import lookup from "country-code-lookup";
import type { FeatureCollection } from "geojson";
import { geoCentroid } from "d3-geo";
import * as echarts from "echarts/core";
import { feature } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";

type Coord = [number, number];

const COUNTRY_ALIASES: Record<string, string> = {
  "United States": "United States of America",
  "USA": "United States of America",
  "US": "United States of America",
  "Russia": "Russia",
  "South Korea": "South Korea",
  "North Korea": "North Korea",
  "Iran": "Iran",
  "Vietnam": "Vietnam",
  "Czechia": "Czech Republic",
  "UAE": "United Arab Emirates",
  "UK": "United Kingdom",
  "United Kingdom": "United Kingdom",
  "Syria": "Syria",
  "Venezuela": "Venezuela",
  "Laos": "Laos",
  "Bolivia": "Bolivia",
  "Moldova": "Moldova",
  "Tanzania": "Tanzania",
};

const SOC_TARGET = {
  name: (import.meta.env.VITE_SOC_TARGET_NAME as string) ?? "SOC Core",
  coords: [
    Number(import.meta.env.VITE_SOC_TARGET_LON ?? 105.8342),
    Number(import.meta.env.VITE_SOC_TARGET_LAT ?? 21.0278),
  ] as Coord,
};

let isRegistered = false;
let centroidMap: Map<string, Coord> | null = null;

function resolveCountryName(country: string): string {
  const trimmed = country.trim();
  if (!trimmed) return trimmed;

  if (COUNTRY_ALIASES[trimmed]) return COUNTRY_ALIASES[trimmed];

  const found = lookup.byCountry(trimmed);
  if (found?.country) return COUNTRY_ALIASES[found.country] ?? found.country;

  return trimmed;
}

function buildCentroidMap(): Map<string, Coord> {
  if (centroidMap) return centroidMap;

  const fc = feature(
    worldAtlas as any,
    (worldAtlas as any).objects.countries,
  ) as unknown as FeatureCollection;

  centroidMap = new Map<string, Coord>();

  fc.features.forEach((item: any) => {
    const name = String(item?.properties?.name ?? "");
    if (!name) return;
    centroidMap?.set(name, geoCentroid(item) as Coord);
  });

  return centroidMap;
}

export function ensureWorldMapRegistered() {
  if (isRegistered) return;

  const fc = feature(
    worldAtlas as any,
    (worldAtlas as any).objects.countries,
  ) as unknown as FeatureCollection;

  echarts.registerMap("world-soc", fc as any);
  buildCentroidMap();
  isRegistered = true;
}

export function getCountryCoord(country: string): Coord | null {
  const resolved = resolveCountryName(country);
  const map = buildCentroidMap();
  return map.get(resolved) ?? null;
}

export function getSocTarget() {
  return SOC_TARGET;
}