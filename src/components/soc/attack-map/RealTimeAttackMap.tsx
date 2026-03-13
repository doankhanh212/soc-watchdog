import { getAttackSeverity } from "@/utils/attackMap";
import { ensureWorldMapRegistered, getCountryCoord, getSocTarget } from "@/utils/worldMap";
import type { AttackMapAlert } from "@/services/wazuhApi";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { EffectScatterChart, LinesChart, ScatterChart } from "echarts/charts";
import { GeoComponent, TooltipComponent } from "echarts/components";
import type { EChartsOption } from "echarts";
import { Radar, Shield } from "lucide-react";
import { useEffect, useMemo } from "react";

echarts.use([GeoComponent, TooltipComponent, LinesChart, ScatterChart, EffectScatterChart, CanvasRenderer]);

interface Props {
  alerts: AttackMapAlert[];
  loading?: boolean;
}

const RealTimeAttackMap = ({ alerts, loading }: Props) => {
  useEffect(() => {
    ensureWorldMapRegistered();
  }, []);

  const option = useMemo<EChartsOption>(() => {
    const target = getSocTarget();
    const stream = alerts.slice(0, 80);

    const severityBuckets = {
      low: [] as any[],
      medium: [] as any[],
      high: [] as any[],
      critical: [] as any[],
    };

    const countryNodes = new Map<string, { name: string; value: [number, number, number]; level: number; count: number }>();

    stream.forEach((alert) => {
      const fromCoord = getCountryCoord(alert.country);
      if (!fromCoord) return;

      const severity = getAttackSeverity(alert.level);
      severityBuckets[severity.key].push({
        fromName: alert.country,
        toName: target.name,
        coords: [fromCoord, target.coords],
        alert,
        lineStyle: {
          color: severity.color,
          width: severity.key === "critical" ? 2.8 : severity.key === "high" ? 2.2 : 1.6,
          opacity: severity.key === "critical" ? 0.95 : 0.78,
          curveness: 0.18,
          shadowBlur: severity.key === "critical" ? 18 : 12,
          shadowColor: severity.glow,
        },
      });

      const existing = countryNodes.get(alert.country);
      if (existing) {
        existing.count += 1;
        existing.level = Math.max(existing.level, alert.level);
        existing.value = [existing.value[0], existing.value[1], existing.count];
        return;
      }

      countryNodes.set(alert.country, {
        name: alert.country,
        value: [fromCoord[0], fromCoord[1], 1],
        level: alert.level,
        count: 1,
      });
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(2, 6, 23, 0.96)",
        borderColor: "rgba(51, 65, 85, 0.9)",
        borderWidth: 1,
        textStyle: {
          color: "#e2e8f0",
          fontFamily: "JetBrains Mono",
        },
        formatter: (params: any) => {
          if (params.data?.alert) {
            const alert = params.data.alert as AttackMapAlert;
            const severity = getAttackSeverity(alert.level);
            return [
              `<div style=\"font-size:12px; text-transform:uppercase; letter-spacing:0.18em; color:${severity.color}; margin-bottom:6px;\">${severity.label}</div>`,
              `<div style=\"font-size:13px; font-weight:600; margin-bottom:4px;\">${alert.country} → ${target.name}</div>`,
              `<div style=\"font-size:12px; color:#94a3b8; margin-bottom:4px;\">${alert.description}</div>`,
              `<div style=\"font-size:12px;\">${alert.srcIp}</div>`,
            ].join("");
          }

          if (Array.isArray(params.value)) {
            return `
              <div style=\"font-size:12px; text-transform:uppercase; letter-spacing:0.18em; color:#38bdf8; margin-bottom:6px;\">Origin node</div>
              <div style=\"font-size:13px; font-weight:600; margin-bottom:4px;\">${params.name}</div>
              <div style=\"font-size:12px; color:#e2e8f0;\">${Number(params.value[2] ?? 0).toLocaleString()} active traces</div>
            `;
          }

          return params.name;
        },
      },
      geo: {
        map: "world-soc",
        roam: true,
        zoom: 1.12,
        center: [20, 18],
        itemStyle: {
          areaColor: "#081425",
          borderColor: "#18426a",
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: {
            areaColor: "#0f2940",
          },
          label: { show: false },
        },
        silent: true,
      },
      series: [
        {
          type: "effectScatter",
          coordinateSystem: "geo",
          zlevel: 4,
          rippleEffect: { brushType: "stroke", scale: 6 },
          symbolSize: 14,
          itemStyle: {
            color: "#facc15",
            shadowBlur: 20,
            shadowColor: "rgba(250, 204, 21, 0.8)",
          },
          data: [{ name: target.name, value: [...target.coords, 1] }],
        },
        {
          type: "scatter",
          coordinateSystem: "geo",
          zlevel: 3,
          symbolSize: (value: number[]) => Math.max(8, Math.min(18, Number(value[2] ?? 0) + 6)),
          itemStyle: {
            color: "#38bdf8",
            shadowBlur: 14,
            shadowColor: "rgba(56, 189, 248, 0.55)",
          },
          data: Array.from(countryNodes.values()).map((node) => ({
            name: node.name,
            value: node.value,
            itemStyle: {
              color: getAttackSeverity(node.level).color,
              shadowBlur: node.level >= 14 ? 18 : 12,
              shadowColor: getAttackSeverity(node.level).glow,
            },
          })),
        },
        ...(["low", "medium", "high", "critical"] as const).map((key) => {
          const severity = getAttackSeverity(key === "low" ? 3 : key === "medium" ? 8 : key === "high" ? 12 : 15);
          return {
            type: "lines",
            coordinateSystem: "geo",
            zlevel: key === "critical" ? 5 : 2,
            effect: {
              show: true,
              period: key === "critical" ? 1.8 : 3.2,
              trailLength: key === "critical" ? 0.34 : 0.2,
              symbol: "circle",
              symbolSize: key === "critical" ? 5 : 3,
              color: severity.color,
            },
            lineStyle: {
              color: severity.color,
              width: key === "critical" ? 2.4 : 1.5,
              opacity: key === "critical" ? 0.9 : 0.55,
              curveness: 0.18,
            },
            blendMode: "lighter",
            data: severityBuckets[key],
          };
        }),
      ],
    };
  }, [alerts]);

  return (
    <section className="soc-card overflow-hidden border-info/20 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(239,68,68,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,10,22,0.96))]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-info">
            <Radar className="h-4 w-4" />
            <span className="text-[11px] font-mono uppercase tracking-[0.28em] text-info/80">
              Global Attack Map
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Real-time hostile traffic toward monitored infrastructure</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Animated traces visualize recent geo-located Wazuh and Suricata detections converging on the SOC core.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.2em] text-primary">
          <Shield className="h-3.5 w-3.5" />
          {getSocTarget().name}
        </div>
      </div>

      <div className="relative h-[540px] overflow-hidden rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(8,15,30,0.96),rgba(2,6,23,0.88))]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_70%)]" />
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs font-mono text-muted-foreground animate-pulse">Synchronizing live geolocation traces…</p>
          </div>
        ) : (
          <ReactEChartsCore
            echarts={echarts}
            option={option}
            notMerge
            lazyUpdate
            style={{ height: "100%", width: "100%" }}
          />
        )}
      </div>
    </section>
  );
};

export default RealTimeAttackMap;