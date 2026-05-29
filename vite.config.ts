import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/lst-userapp/" : "/",
  server: {
    host: "::",
    port: 8080,
    // 允許 cloudflared / localtunnel 臨時 tunnel 的 host（html.to.design 雲端匯入用），否則 Vite 5.4+ 預設會擋外來 Host
    allowedHosts: [".trycloudflare.com", ".loca.lt"],
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
