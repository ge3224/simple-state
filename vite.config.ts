import dts from "vite-plugin-dts";
import path from "node:path";
import process from "node:process";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const isMinified = !process.env.BUILD_UNMINIFIED;

export default defineConfig({
  root: process.env.VITE_ROOT || ".",
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "SimpleState",
      fileName: (format) => {
        const suffix = isMinified ? ".min.js" : ".js";
        if (format === "es") return `simple-state.esm${suffix}`;
        if (format === "iife") return `simple-state.iife${suffix}`;
        if (format === "umd") return `simple-state.umd${suffix}`;
        return `simple-state${suffix}`;
      },
      formats: ["es", "iife", "umd"],
    },
    minify: isMinified ? "esbuild" : false,
    rollupOptions: {
      external: [],
    },
  },
  plugins: [dts({ include: ["src/index.ts"] })],
});
