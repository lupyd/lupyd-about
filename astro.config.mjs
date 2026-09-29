import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.lupyd.com',
  redirects: {
    '/privacy-policy': '/privacy',
    '/feature': '/features',
    '/data-deletion': '/delete-account',
    '/account-deletion': '/delete-account',
  },
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/privacy-policy') && !page.includes('/data-deletion') && !page.includes('/account-deletion'),
    }),
  ],
});
