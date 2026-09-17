import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      xorlab: resolve(__dirname, "../../xorlab/src/index.ts"),
      "xorlab-linalg": resolve(__dirname, "../../xorlab-linalg/src/index.ts"),
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
