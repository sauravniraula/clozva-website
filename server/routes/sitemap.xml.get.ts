// Serves the public storefront URLs as XML, using the catalog directly so no database is needed.
import { categories, productSeeds } from '#shared/catalog'
import { productPath, salePath, shopPath, siteOrigin } from '#shared/seo'

const paths = ['/', shopPath(), '/about', '/help', '/brand', salePath,
  ...categories.map(category => shopPath(category.id)),
  ...productSeeds.map(product => productPath(product.id)),
]

export default defineEventHandler((event) => {
  const origin = siteOrigin(useRuntimeConfig(event).public.siteUrl, getRequestURL(event))
  const urls = paths.map(path => {
    const url = `${origin}${path}`.replaceAll('&', '&amp;')
    return `  <url><loc>${url}</loc></url>`
  })
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
})
