import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Bundle analyzer in build mode
    mode === "production" && visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "sunburst", // or treemap, network, raw-data
    }),
    // Gzip compression analysis
    mode === "production" && viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // Only compress files larger than 10kb
      algorithm: "gzip",
      ext: ".gz",
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable source maps for production debugging
    sourcemap: mode === "production" ? "hidden" : false,

    // Handle CommonJS/ESM mixed packages
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },

    // Simplified chunk splitting to avoid circular dependency issues
    rollupOptions: {
      output: {
        // Let Vite handle chunk splitting automatically with minimal manual intervention
        manualChunks: {
          // Only split out large, stable dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
        },
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },

    // Build optimizations
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: true,
        pure_funcs: mode === "production" ? ["console.log", "console.info"] : [],
      },
      format: {
        comments: false,
      },
    },

    // Performance budgets
    chunkSizeWarningLimit: 500, // 500kb warning threshold

    // Report compressed size
    reportCompressedSize: true,

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Optimize dependencies - include CommonJS packages that need ESM conversion
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "recharts",
      "pdfjs-dist",
      "csv-parse",
      "next-themes",
      // Supabase and its CJS dependencies must be included for ESM transformation
      "@supabase/supabase-js",
      "@supabase/postgrest-js",
      "@supabase/realtime-js",
      "@supabase/storage-js",
      "@supabase/auth-js",
      "@supabase/functions-js",
    ],
    // Force ESM transformation for problematic packages
    esbuildOptions: {
      target: "es2020",
    },
  },
}));
