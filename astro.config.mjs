import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.lupyd.com',
  redirects: {
    '/privacy-policy': '/privacy',
    '/feature': '/features',
  },
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/privacy-policy'),
    }),
  ],
});
