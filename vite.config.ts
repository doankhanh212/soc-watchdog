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
      },
    },
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
  };
});
