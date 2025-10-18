// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  integrations: [react()],
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
});
