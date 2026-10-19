import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// In dev, /api is proxied to the FastAPI backend (default http://localhost:8000).
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: {
    proxy: {
      "/api": { target: process.env.VITE_BACKEND_URL ?? "http://localhost:8000", changeOrigin: true },
    },
  },
});
