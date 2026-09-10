import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// Served from https://danielhkuo.github.io/HoldTrue/ — a GitHub Pages project site.
export default defineConfig({
  base: "/HoldTrue/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})
