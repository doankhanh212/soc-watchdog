import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load .env so proxy values are available in the Node.js build context
  const env = loadEnv(mode, process.cwd(), "");
  const wazuhTarget = env.VITE_WAZUH_TARGET ?? "https://localhost:9200";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: { overlay: false },
      proxy: {
        // Forward /api/os/* → OpenSearch node (handles CORS + self-signed TLS)
        "/api/os": {
          target:      wazuhTarget,
          changeOrigin: true,
          rewrite:     (p) => p.replace(/^\/api\/os/, ""),
          secure:      false, // accept self-signed certificates
        },
        // GeoIP fallback — ip-api.com batch resolver (free tier, HTTP only)
        "/api/geoip": {
          target:       "http://ip-api.com",
          changeOrigin: true,
          rewrite:      (p) => p.replace(/^\/api\/geoip/, ""),
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("echarts") || id.includes("world-atlas") || id.includes("d3-geo") || id.includes("topojson")) return "echarts-map";
            if (id.includes("recharts") || id.includes("chart.js") || id.includes("react-chartjs-2")) return "charts";
            if (id.includes("@radix-ui")) return "radix";
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("react-router-dom")) return "router";
            if (id.includes("lucide-react")) return "icons";
            return "vendor";
          },
        },
      },
    },
  };
});
