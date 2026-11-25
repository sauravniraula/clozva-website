import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { access } from 'node:fs/promises'
import handler, { config } from '../.netlify/functions-internal/server/server.mjs'

assert.equal(config.path, '/*')
assert.equal(config.preferStatic, true)
await access(new URL('../dist/images/campaign.webp', import.meta.url))
await access(new URL('../dist/brand/comfort-club.svg', import.meta.url))

const request = (path, options) => handler(new Request(`https://clozva.example${path}`, options))
const post = (path, body) => request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const input = {
  requestId: randomUUID(),
  customer: { name: 'Test Shopper', email: 'shopper@example.test', phone: '415-555-0134', address: '1 Test Lane', city: 'San Francisco', state: 'CA', postalCode: '94103', country: 'US' },
  items: [{ id: 'classic-lime', size: 40, quantity: 1 }],
}

// Test that the build itself disables ephemeral storage, without relying on a host flag.
delete process.env.NETLIFY
delete process.env.DATABASE_URL
assert.deepEqual(await (await request('/api/store-status')).json(), { checkout: false })
const home = await request('/')
assert.equal(home.status, 200)
assert.match(await home.text(), /Free U\.S\. shipping/)
const catalog = await request('/api/products?sale=1')
assert.equal(catalog.status, 200)
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
