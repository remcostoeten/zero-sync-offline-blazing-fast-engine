import { defineConfig } from "vite";
import solid from "solid-start/vite";
import path from "path";

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
