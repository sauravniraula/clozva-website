// Lets crawlers reach storefront pages and discover the sitemap at the preferred site URL.
import { siteOrigin } from '#shared/seo'

export default defineEventHandler((event) => {
  const origin = siteOrigin(useRuntimeConfig(event).public.siteUrl, getRequestURL(event))
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`
})
