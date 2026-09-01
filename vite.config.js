import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Served from the custom domain root (techmemory.overture7421.org via
  // GitHub Pages CNAME), not a /<repo>/ subpath — so base is "/".
  base: "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
