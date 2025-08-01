import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // Make environment variables available at build time
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || "http://localhost:5000"),
  },
})
