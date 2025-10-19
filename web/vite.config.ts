import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ["defaults", "Android >= 4.4", "iOS >= 9"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
  ],
  build: {
    target: "es2015",
  },
});
