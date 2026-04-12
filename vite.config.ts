// @ts-nocheck
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from "path";
import { componentTagger } from 'lovable-tagger';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      tailwindcss(),
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // REMOVED 'process.env': env entirely to fix the 153 errors
    define: {
      'process.env.VITE_ENABLE_ROUTE_MESSAGING': JSON.stringify(env.VITE_ENABLE_ROUTE_MESSAGING),
    },
  };
});