import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { checker } from "vite-plugin-checker";
import tsconfigPaths from "vite-tsconfig-paths";
import posthtml from "posthtml";

const pluginAddAppCheckDebugToken: posthtml.Plugin<unknown> = function (tree) {
  tree.match({ attrs: { id: "appcheck" } }, function (node) {
    node.content = ["self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;"];
    return node;
  });

  return tree;
};

function vitePluginPosthtml(plugins: posthtml.Plugin<never>[]) {
  return {
    name: "vite-plugin-posthtml",
    async transformIndexHtml(html: string) {
      const { html: transformedHtml } = await posthtml(plugins).process(html);
      return transformedHtml;
    },
  };
}

function loadPosthtmlPlugins(mode: string, command: string) {
  const isPreview = mode === "staging" && command === "build";
  const isDevelopment = mode === "development";
  if (isDevelopment || isPreview) {
    console.warn("Using development/preview configuration");
    return [pluginAddAppCheckDebugToken];
  }

  return [];
}

function manualChunks(id: string) {
  if (id.includes("node_modules")) {
    return "vendor";
  }
  return;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const plugins = [tsconfigPaths(), react()];

  console.log(
    'Building UI with mode "%s" and command "%s" on "%s"',
    mode,
    command,
    process.cwd()
  );

  const posthtmlPlugins = loadPosthtmlPlugins(mode, command);
  if (posthtmlPlugins.length > 0) {
    plugins.push(vitePluginPosthtml(posthtmlPlugins));
  }

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
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
    server: {
      port: 5174,
      hmr: {
        clientPort: 5174,
        host: "localhost",
      },
    },
    define: {
      "import.meta.vitest": false,
      "process.env": {},
    },
  };
});
