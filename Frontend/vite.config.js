import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    // Only affects `vite preview` (local production-build preview), not the
    // real deployment — nginx serves the built dist/ directly in prod.
    // Add your own dev/test hostname here if you use `vite preview` remotely.
    allowedHosts: true
  }
})