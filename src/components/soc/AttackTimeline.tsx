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
import { attackTimeline } from "@/data/mockData";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const AttackTimeline = () => {
  const data = {
    labels: attackTimeline.map((p) => p.time),
    datasets: [
      {
        label: "Suricata",
        data: attackTimeline.map((p) => p.suricata),
        borderColor: "hsl(48, 95%, 55%)",
        backgroundColor: "hsla(48, 95%, 55%, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: "hsl(48, 95%, 55%)",
      },
      {
        label: "Wazuh",
        data: attackTimeline.map((p) => p.wazuh),
        borderColor: "hsl(190, 90%, 50%)",
        backgroundColor: "hsla(190, 90%, 50%, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: "hsl(190, 90%, 50%)",
      },
      {
        label: "Blocked",
        data: attackTimeline.map((p) => p.blocked),
        borderColor: "hsl(0, 72%, 51%)",
        backgroundColor: "hsla(0, 72%, 51%, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: "hsl(0, 72%, 51%)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "hsl(215, 15%, 50%)",
          font: { family: "JetBrains Mono", size: 11 },
        },
      },
      tooltip: {
        backgroundColor: "hsl(225, 45%, 9%)",
        borderColor: "hsl(225, 30%, 18%)",
        borderWidth: 1,
        titleFont: { family: "JetBrains Mono" },
        bodyFont: { family: "JetBrains Mono" },
      },
    },
    scales: {
      x: {
        ticks: { color: "hsl(215, 15%, 50%)", font: { family: "JetBrains Mono", size: 10 } },
        grid: { color: "hsla(225, 30%, 18%, 0.5)" },
      },
      y: {
        ticks: { color: "hsl(215, 15%, 50%)", font: { family: "JetBrains Mono", size: 10 } },
        grid: { color: "hsla(225, 30%, 18%, 0.5)" },
      },
    },
  };

  return (
    <div className="soc-card">
      <h2 className="text-sm font-mono font-semibold text-primary uppercase tracking-wider mb-3">
        Attack Timeline (Today)
      </h2>
      <div className="h-[250px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default AttackTimeline;
