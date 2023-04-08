import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { checker } from "vite-plugin-checker";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const plugins = [tsconfigPaths(), react()];

  const isTest = process.env.NODE_ENV === "test" || process.env.VITEST;
  if (!isTest) {
    plugins.unshift(
      checker({
        typescript: true,
        eslint: {
          lintCommand: "eslint --ext .ts,.tsx,.js,.jsx .",
        },
      })
    );
  }

  return {
    plugins,
  };
});
