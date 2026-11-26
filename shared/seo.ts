// Keeps storefront metadata and crawler routes on the same preferred origin and URLs.
import type { CategoryId } from './catalog.ts'

export function siteOrigin(configuredUrl: string, requestUrl: URL): string {
  const url = configuredUrl ? new URL(configuredUrl) : requestUrl
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new TypeError('The storefront site URL must use HTTP or HTTPS')
  }
  return url.origin
}

export const shopPath = (category?: CategoryId) => category ? `/shop?category=${category}` : '/shop'
export const salePath = '/shop?sale=1'
export const productPath = (id: string) => `/products/${encodeURIComponent(id)}`
