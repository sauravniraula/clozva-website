import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { access } from 'node:fs/promises'
import handler, { config } from '../.netlify/functions-internal/server/server.mjs'
import { categories, productSeeds } from '../shared/catalog.ts'

assert.equal(config.path, '/*')
assert.equal(config.preferStatic, true)
await access(new URL('../dist/images/campaign.webp', import.meta.url))
await access(new URL('../dist/brand/comfort-club.svg', import.meta.url))

const request = (path, options) => handler(new Request(`https://clozva.example${path}`, options))
const post = (path, body) => request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const getHead = html => html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? ''
const getTags = (head, tag) => [...head.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'g'))].map(([element]) =>
  Object.fromEntries([...element.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value])),
)
const canonicals = head => getTags(head, 'link').filter(tag => tag.rel === 'canonical').map(tag => tag.href)
const meta = (head, key) => getTags(head, 'meta').find(tag => tag.name === key || tag.property === key)?.content
const schema = head => JSON.parse(head.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? 'null')
const input = {
  requestId: randomUUID(),
  customer: { name: 'Test Shopper', email: 'shopper@example.test', phone: '415-555-0134', address: '1 Test Lane', city: 'San Francisco', state: 'CA', postalCode: '94103', country: 'US' },
  items: [{ id: 'classic-lime', size: 40, quantity: 1 }],
}

// Test that the build itself disables ephemeral storage, without relying on a host flag.
delete process.env.NETLIFY
delete process.env.DATABASE_URL
const siteUrl = 'https://www.clozva.example'
process.env.NUXT_PUBLIC_SITE_URL = `${siteUrl}/`
assert.deepEqual(await (await request('/api/store-status')).json(), { checkout: false })
const home = await request('/')
assert.equal(home.status, 200)
const homeHtml = await home.text()
assert.match(homeHtml, /Free U\.S\. shipping/)
const blogUrl = 'https://clozva.wordpress.com/'
const socialUrls = ['https://www.instagram.com/clozva/', 'https://www.reddit.com/user/clozva/']
for (const label of ['Main navigation', 'Mobile navigation', 'Footer help links']) {
  const navigation = [...homeHtml.matchAll(/<nav\b[^>]*aria-label="([^"]+)"[^>]*>([\s\S]*?)<\/nav>/g)]
    .find(([, name]) => name === label)?.[2] ?? ''
  assert.ok(getTags(navigation, 'a').some(link => link.href === blogUrl), `Expected the Blog link in ${label}`)
}
const footer = homeHtml.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1] ?? ''
assert.deepEqual(getTags(footer, 'a').filter(link => socialUrls.includes(link.href)).map(link => link.href), socialUrls)
const head = getHead(homeHtml)
const loader = [...head.matchAll(/<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=GTM-N48LWJMH"[^>]*>/g)]
assert.equal(loader.length, 1, 'Expected one Google Tag Manager loader in the document head')
assert.match(loader[0][0], /\basync\b/)
const init = head.indexOf('window.dataLayer = window.dataLayer || []')
assert.ok(init >= 0 && init < loader[0].index, 'Initialize the data layer before loading GTM')
assert.ok(head.includes("gtag('js', new Date())"))
const clarity = [...head.matchAll(/<script\b[^>]*>([^<]*https:\/\/www\.clarity\.ms\/tag\/[^<]*)<\/script>/g)]
assert.equal(clarity.length, 1, 'Expected one Microsoft Clarity loader in the document head')
assert.match(clarity[0][1], /\(window, document, "clarity", "script", "zjj5owcmnt"\)/)

const robots = await request('/robots.txt')
assert.equal(robots.status, 200)
assert.match(robots.headers.get('content-type'), /^text\/plain/)
assert.equal(await robots.text(), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
const sitemap = await request('/sitemap.xml')
assert.equal(sitemap.status, 200)
assert.match(sitemap.headers.get('content-type'), /^application\/xml/)
const xml = await sitemap.text()
assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">[\s\S]+<\/urlset>\s*$/)
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url)
const publicPaths = ['/', '/shop', '/about', '/help', '/brand', '/shop?sale=1',
  ...categories.map(({ id }) => `/shop?category=${id}`), ...productSeeds.map(({ id }) => `/products/${id}`),
]
assert.deepEqual([...urls].sort(), publicPaths.map(path => `${siteUrl}${path}`).sort())

const titles = new Set()
const descriptions = new Set()
for (const path of publicPaths) {
  const response = await request(path)
  assert.equal(response.status, 200, path)
  const pageHead = getHead(await response.text())
  assert.deepEqual(canonicals(pageHead), [`${siteUrl}${path}`], path)
  assert.equal(meta(pageHead, 'og:url'), `${siteUrl}${path}`, path)
  assert.equal(meta(pageHead, 'twitter:card'), 'summary_large_image', path)
  assert.ok(!meta(pageHead, 'robots')?.includes('noindex'), path)
  const title = pageHead.match(/<title>([^<]+)<\/title>/)?.[1]
  assert.ok(title && !titles.has(title), `Expected a distinct title for ${path}`)
  titles.add(title)
  const description = meta(pageHead, 'description')
  assert.ok(description && !descriptions.has(description), `Expected a distinct description for ${path}`)
  descriptions.add(description)
}

assert.equal(meta(head, 'og:image'), `${siteUrl}/images/campaign.webp`)
const homeSchema = schema(head)['@graph']
assert.ok(homeSchema.some(node => node['@type'] === 'WebSite' && node.name === 'CLOZVA' && node.url === `${siteUrl}/`))
assert.deepEqual(homeSchema.find(node => node['@type'] === 'Organization')?.sameAs, socialUrls)
const sortedHead = getHead(await (await request('/shop?category=classic&sort=price-asc&utm_source=test')).text())
assert.deepEqual(canonicals(sortedHead), [`${siteUrl}/shop?category=classic`])
const productHead = getHead(await (await request('/products/classic-lime?utm_source=test')).text())
assert.deepEqual(canonicals(productHead), [`${siteUrl}/products/classic-lime`])
assert.equal(meta(productHead, 'og:image'), `${siteUrl}/images/classic-lime.webp`)
const [productSchema, breadcrumbs] = schema(productHead)['@graph']
assert.equal(productSchema['@type'], 'Product')
assert.equal(productSchema.name, 'The Classic Clog in Electric Lime')
assert.equal(productSchema.image, `${siteUrl}/images/classic-lime.webp`)
assert.equal(productSchema.offers, undefined)
assert.equal(breadcrumbs['@type'], 'BreadcrumbList')
assert.deepEqual(breadcrumbs.itemListElement.map(item => item.item), [`${siteUrl}/shop`, `${siteUrl}/shop?category=classic`, `${siteUrl}/products/classic-lime`])

for (const path of ['/checkout', '/order/test-receipt', '/shop?q=lime', '/shop?sale=1&category=classic', '/products/missing-product']) {
  const response = await request(path)
  assert.equal(response.status, path.startsWith('/products/') ? 404 : 200, path)
  const pageHead = getHead(await response.text())
  assert.equal(meta(pageHead, 'robots'), 'noindex', path)
  assert.deepEqual(canonicals(pageHead), [], path)
}
console.log(`Netlify handler: validated ${urls.length} sitemap URLs, page metadata, and structured data.`)

const catalog = await request('/api/products?sale=1')
assert.equal(catalog.status, 200)
assert.equal(catalog.headers.get('x-robots-tag'), 'noindex')
assert.equal((await catalog.json()).length, 3)
assert.equal((await post('/api/orders', input)).status, 503)
assert.equal((await post('/api/newsletter', { email: 'shopper@example.test' })).status, 503)
console.log('Netlify handler: browse-only mode serves the catalog and rejects writes without a database.')

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  assert.deepEqual(await (await request('/api/store-status')).json(), { checkout: true })
  const create = await post('/api/orders', input)
  assert.equal(create.status, 201)
  const order = await create.json()
  assert.equal(order.total, 4595)
  assert.equal(order.currency, 'USD')
  const receipt = await request(`/api/orders/${order.id}`, { headers: { 'x-receipt-token': order.token } })
  assert.equal(receipt.status, 200)
  const details = await receipt.json()
  assert.equal(details.total, order.total)
  assert.equal(details.token, undefined)
  assert.equal((await request(`/api/orders/${order.id}`)).status, 404)
  assert.equal((await post('/api/newsletter', { email: `${randomUUID()}@example.test` })).status, 200)
  console.log('Netlify handler: PostgreSQL checkout, private receipt, and newsletter signup passed.')
}
