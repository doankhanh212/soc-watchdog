import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import type { AttackTimelinePoint } from "@/services/wazuhApi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  timeline: AttackTimelinePoint[];
  loading?: boolean;
}

const AttackTimeline = ({ timeline, loading }: Props) => {
  const labels   = timeline.map((p) => p.time);
  const chartData = {
    labels,
    datasets: [
      {
        label: "Cảnh báo mạng",
        data: timeline.map((p) => p.suricata),
        borderColor: "hsl(52, 100%, 50%)",
        backgroundColor: "hsla(52, 100%, 50%, 0.1)",
        fill: true, tension: 0.3, pointRadius: 3,
        pointBackgroundColor: "hsl(52, 100%, 50%)",
      },
      {
        label: "Wazuh",
        data: timeline.map((p) => p.wazuh),
        borderColor: "hsl(190, 90%, 50%)",
        backgroundColor: "hsla(190, 90%, 50%, 0.1)",
        fill: true, tension: 0.3, pointRadius: 3,
        pointBackgroundColor: "hsl(190, 90%, 50%)",
      },
      {
        label: "Đã chặn",
        data: timeline.map((p) => p.blocked),
        borderColor: "hsl(0, 72%, 51%)",
        backgroundColor: "hsla(0, 72%, 51%, 0.1)",
        fill: true, tension: 0.3, pointRadius: 3,
        pointBackgroundColor: "hsl(0, 72%, 51%)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "hsl(215, 15%, 50%)", font: { family: "JetBrains Mono", size: 11 } },
      },
      tooltip: {
        backgroundColor: "hsl(225, 45%, 9%)",
        borderColor: "hsl(225, 30%, 18%)",
        borderWidth: 1,
        titleFont: { family: "JetBrains Mono" },
        bodyFont:  { family: "JetBrains Mono" },
      },
    },
    scales: {
      x: {
        ticks: { color: "hsl(215, 15%, 50%)", font: { family: "JetBrains Mono", size: 10 } },
        grid:  { color: "hsla(225, 30%, 18%, 0.5)" },
      },
      y: {
        ticks: { color: "hsl(215, 15%, 50%)", font: { family: "JetBrains Mono", size: 10 } },
        grid:  { color: "hsla(225, 30%, 18%, 0.5)" },
      },
    },
  };

  return (
    <div className="soc-card">
      <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3">
        Dòng thời gian tấn công (24 giờ qua)
      </h2>
      <div className="h-[250px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs font-mono text-muted-foreground animate-pulse">Đang tải dữ liệu…</p>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default AttackTimeline;
