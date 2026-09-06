import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://about.lupyd.com',
  integrations: [tailwind(), sitemap({ lastmod: new Date('2026-09-06T16:07:46.188Z') })],
});
