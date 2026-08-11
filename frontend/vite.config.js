import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      // Local dev: browser talks to same origin; Vite forwards to Flask
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});