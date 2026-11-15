import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    // next-intl and Auth.js ship ESM that imports "next/server" without an extension.
    // Inlining lets Vite resolve it the way Next's own bundler does.
    server: { deps: { inline: [/next-intl/, /next-auth/, /@auth\/core/] } }
  }
});
