// astro.config.mjs
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap'; // ← ajout du plugin sitemap

export default defineConfig({
  // ⚠️ URL finale de ton site en prod
  site: 'https://stephaniequibel.fr',
output: 'static',   

  integrations: [
    react(),
    sitemap(), // ← génère automatiquement /sitemap.xml au build
  ],

  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});
