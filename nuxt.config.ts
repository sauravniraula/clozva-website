export default defineNuxtConfig({
  compatibilityDate: '2025-10-01',
  devtools: { enabled: false },
  runtimeConfig: { clozvaRequireDatabase: process.env.NITRO_PRESET === 'netlify' },
  css: ['@fontsource-variable/manrope/wght.css', '@fontsource-variable/space-grotesk/wght.css', '~/assets/css/main.css'],
  app: { head: { htmlAttrs: { lang: 'en-US' }, link: [{ rel: 'icon', type: 'image/svg+xml', href: '/brand/monogram.svg' }] } },
})