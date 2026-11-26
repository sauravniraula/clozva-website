// Renders canonical and social metadata for storefront pages, and noindex for non-public views.
import { siteOrigin } from '#shared/seo'

interface StoreSeo {
  title: string
  description: string
  path?: string
  image?: string
  imageAlt?: string
}

/** Pass the preferred path and query, or omit the path to keep the view out of search. */
export function useStoreSeo(source: StoreSeo | (() => StoreSeo)) {
  const origin = siteOrigin(useRuntimeConfig().public.siteUrl, useRequestURL())
  const page = computed(() => toValue(source))
  const url = computed(() => page.value.path ? `${origin}${page.value.path}` : undefined)
  const image = computed(() => url.value ? `${origin}${page.value.image || '/images/campaign.webp'}` : undefined)

  useHead(() => ({ link: url.value ? [{ rel: 'canonical', href: url.value }] : [] }))
  useSeoMeta({
    title: () => page.value.title,
    description: () => page.value.description,
    robots: () => url.value ? undefined : 'noindex',
    ogSiteName: 'CLOZVA',
    ogLocale: 'en_US',
    ogType: 'website',
    ogTitle: () => `${page.value.title} · CLOZVA`,
    ogDescription: () => page.value.description,
    ogUrl: () => url.value,
    ogImage: () => image.value,
    ogImageAlt: () => image.value ? page.value.imageAlt || 'Electric lime CLOZVA clogs on a sage green backdrop' : undefined,
    twitterCard: () => image.value ? 'summary_large_image' : undefined,
  })

  return { origin, url, image }
}

export function useStoreJsonLd(data: object) {
  useHead({
    script: [{
      key: 'store-structured-data',
      type: 'application/ld+json',
      // Escape markup delimiters so text values cannot close the script element.
      innerHTML: JSON.stringify(data).replaceAll('<', '\\u003c'),
    }],
  })
}
