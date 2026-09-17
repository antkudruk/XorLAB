import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      xorlab: resolve(__dirname, "../../xorlab/src/index.ts"),
      "xorlab-discover": resolve(__dirname, "../../xorlab-discover/src/index.ts"),
      "xorlab-interactive": resolve(__dirname, "../../xorlab-interactive/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        discover: resolve(__dirname, "discover/index.html"),
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
