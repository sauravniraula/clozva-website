export default defineNuxtConfig({
  compatibilityDate: '2025-10-01',
  devtools: { enabled: false },
  // lucide-vue-next ships no "exports" map, so Node loads its CommonJS build at runtime,
  // which can't require() Vue's ES module in the Netlify function. Bundle its ESM build instead.
  build: { transpile: ['lucide-vue-next'] },
  runtimeConfig: {
    clozvaRequireDatabase: process.env.NITRO_PRESET === 'netlify',
    public: { siteUrl: process.env.NETLIFY === 'true' ? process.env.URL || '' : '' },
  },
  routeRules: { '/api/**': { headers: { 'X-Robots-Tag': 'noindex' } } },
  css: ['@fontsource-variable/manrope/wght.css', '@fontsource-variable/space-grotesk/wght.css', '~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en-US' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/brand/monogram.svg' }],
      script: [
        {
          key: 'clozva-data-layer',
          tagPriority: 80,
          innerHTML: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`,
        },
        {
          key: 'clozva-gtm',
          tagPriority: 81,
          async: true,
          src: 'https://www.googletagmanager.com/gtm.js?id=GTM-N48LWJMH',
        },
        {
          key: 'clozva-clarity',
          innerHTML: `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "zjj5owcmnt");`,
        },
      ],
    },
  },
})
