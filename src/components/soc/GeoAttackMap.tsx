import { Globe } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { GeoPoint } from "@/services/wazuhApi";

interface Props {
  geoData: GeoPoint[];
  loading?: boolean;
}

const BAR_COLORS = [
  "hsl(0, 72%, 51%)",    // danger red – top attacker
  "hsl(38, 92%, 50%)",   // warning amber
  "hsl(52, 100%, 50%)",  // primary yellow
  "hsl(190, 90%, 50%)",  // accent cyan
];
const pickColor = (i: number) => BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as GeoPoint;
  return (
    <div className="bg-card border border-border rounded px-3 py-2 text-xs font-mono shadow-lg">
      <p className="text-foreground font-semibold">{d.country}</p>
      <p className="text-primary mt-0.5">{d.hits.toLocaleString()} lượt tấn công</p>
    </div>
  );
};

const GeoAttackMap = ({ geoData, loading }: Props) => (
  <div className="soc-card">
    <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
      <Globe className="h-4 w-4" />
      Bản đồ tấn công địa lý (24 giờ qua)
    </h2>

    <div className="h-[260px]">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-xs font-mono text-muted-foreground animate-pulse">Đang tải dữ liệu…</p>
        </div>
      ) : geoData.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-xs font-mono text-muted-foreground">
            Không có dữ liệu GeoLocation – bật enrichment trong Wazuh pipeline
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={geoData}
            margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "hsl(215, 15%, 50%)", fontFamily: "JetBrains Mono", fontSize: 10 }}
              axisLine={{ stroke: "hsl(225, 30%, 18%)" }}
              tickLine={false}
            />
            <YAxis
              dataKey="country"
              type="category"
              width={110}
              tick={{ fill: "hsl(215, 15%, 65%)", fontFamily: "JetBrains Mono", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsla(225, 30%, 18%, 0.4)" }} />
            <Bar dataKey="hits" radius={[0, 3, 3, 0]}>
              {geoData.map((_, i) => (
                <Cell key={i} fill={pickColor(i)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

export default GeoAttackMap;
