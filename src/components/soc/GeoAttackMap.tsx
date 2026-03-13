import { Globe } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import lookup from "country-code-lookup";
import type { GeoPoint } from "@/services/wazuhApi";
import { useMemo } from "react";
import "flag-icons/css/flag-icons.min.css";

interface Props {
  geoData: GeoPoint[];
  loading?: boolean;
}

const TOP_COUNT = 10;

// Detect whether a string looks like an IPv4 address
const IS_IP_RE = /^\d{1,3}\.\d{1,3}/;

function resolveIso(name: string): string {
  if (!name || name === "Others") return "un";
  const overrides: Record<string, string> = {
    "Russia": "ru", "South Korea": "kr", "Vietnam": "vn",
    "Iran": "ir", "Taiwan": "tw", "United Kingdom": "gb",
    "China": "cn", "United States": "us", "United States of America": "us",
  };
  if (overrides[name]) return overrides[name];
  return lookup.byCountry(name)?.iso2?.toLowerCase() ?? "un";
}

// Gradient definitions for SVG
const Gradients = () => (
  <defs>
    <linearGradient id="colorHighRisk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#facc15" />
      <stop offset="100%" stopColor="#ef4444" />
    </linearGradient>
  </defs>
);

const CustomYAxisTick = ({ x, y, payload }: any) => {
  const countryName: string = payload.value;
  const isIp = IS_IP_RE.test(countryName);
  const showFlag = !isIp && countryName !== "Others";

  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-140} y={-10} width={135} height={20}>
        <div className="flex items-center justify-end w-full h-full gap-2 pr-2">
          <span
            className="text-xs font-mono text-muted-foreground truncate text-right"
            style={{ maxWidth: isIp ? 125 : 90 }}
            title={countryName}
          >
            {countryName}
          </span>
          {showFlag && (
            <span
              className={`fi fi-${resolveIso(countryName)} rounded-sm shadow-sm`}
              style={{ width: "16px", height: "12px", flexShrink: 0 }}
            />
          )}
        </div>
      </foreignObject>
    </g>
  );
};

const CustomTooltip = ({ active, payload, totalHits }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const percent = totalHits > 0 ? ((d.hits / totalHits) * 100).toFixed(1) : "0";

  return (
    <div className="bg-popover border border-border rounded px-3 py-2 text-xs font-mono shadow-xl z-50">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-foreground">{d.country}</span>
        <span className="text-muted-foreground text-xs">({percent}%)</span>
      </div>
      <p className="text-primary font-semibold">
        {d.hits.toLocaleString()}{" "}
        <span className="text-muted-foreground font-normal">tấn công</span>
      </p>
    </div>
  );
};

const GeoAttackMap = ({ geoData, loading }: Props) => {
  const { processedData, totalHits } = useMemo(() => {
    if (!geoData.length) return { processedData: [], totalHits: 0 };

    const sorted = [...geoData].sort((a, b) => b.hits - a.hits);
    const total = sorted.reduce((sum, item) => sum + item.hits, 0);

    let finalData = sorted;
    if (sorted.length > TOP_COUNT) {
      const top = sorted.slice(0, TOP_COUNT);
      const others = sorted.slice(TOP_COUNT).reduce((sum, item) => sum + item.hits, 0);
      finalData = [...top, { country: "Others", hits: others }];
    }

    return { processedData: finalData, totalHits: total };
  }, [geoData]);

  return (
    <div className="soc-card h-full flex flex-col">
      <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4" />
        {processedData.length > 0 && IS_IP_RE.test(processedData[0].country)
          ? "Top IP nguồn tấn công"
          : "Bản đồ tấn công địa lý (Top Origins)"}
      </h2>

      <div className="flex-1 min-h-[300px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs font-mono text-muted-foreground animate-pulse">
              Đang tải dữ liệu…
            </p>
          </div>
        ) : processedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Globe className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs font-mono text-muted-foreground text-center">
              Chưa có dữ liệu địa lý.
              <br />
              Đang tra cứu IP nguồn tấn công…
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={processedData}
              margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              barCategoryGap={4}
            >
              <Gradients />
              <XAxis type="number" hide />
              <YAxis
                dataKey="country"
                type="category"
                width={140}
                tick={<CustomYAxisTick />}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip totalHits={totalHits} />}
                cursor={{ fill: "hsl(var(--accent) / 0.1)", radius: 4 }}
              />
              <Bar dataKey="hits" radius={[0, 4, 4, 0]} barSize={14}>
                {processedData.map((entry, index) => {
                  const isTop3 = index < 3 && entry.country !== "Others";
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isTop3 ? "url(#colorHighRisk)" : "hsl(var(--secondary))"}
                      stroke={isTop3 ? "none" : "hsl(var(--border))"}
                      strokeWidth={1}
                    />
                  );
                })}
                <LabelList
                  dataKey="hits"
                  position="right"
                  formatter={(val: number) => val.toLocaleString()}
                  style={{
                    fill: "hsl(var(--foreground))",
                    fontSize: "12px",
                    fontFamily: "JetBrains Mono",
                    opacity: 0.8,
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default GeoAttackMap;
