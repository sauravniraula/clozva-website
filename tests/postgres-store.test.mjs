import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { openPostgresStore } from '../server/utils/postgres-store.ts'

const url = process.env.TEST_DATABASE_URL
const customer = { name: 'Test Shopper', email: 'shopper@example.test', phone: '415-555-0134', address: '1 Test Lane', city: 'San Francisco', state: 'CA', postalCode: '94103', country: 'US' }
const line = { id: 'classic-lime', size: 39, quantity: 1, price: 1 }

test('Postgres checkout shares stock across workers, retries once, and rolls back unavailable orders', { skip: !url }, async () => {
  const first = openPostgresStore(url)
  const second = openPostgresStore(url)
  try {
    const before = (await first.getProduct(line.id)).stock[39]
    assert.ok((await second.listProducts()).some(product => product.id === line.id))
    const input = { requestId: randomUUID(), customer, items: [line] }
    const [order, retry] = await Promise.all([first.placeOrder(input), second.placeOrder(input)])
    assert.equal(order.currency, 'USD')
    assert.equal(order.total, 4595)
    assert.deepEqual(order, retry)
    assert.equal((await second.getProduct(line.id)).stock[39], before - 1)
    assert.deepEqual(await second.getReceipt(order.id, order.token), order)
    assert.equal(await second.getReceipt(order.id, 'incorrect'), undefined)
    await assert.rejects(first.placeOrder({ ...input, items: [{ ...line, size: 40 }] }), /different checkout/)
    await assert.rejects(first.placeOrder({ ...input, requestId: randomUUID(), items: [line, { ...line, size: 44, quantity: 5 }] }), /not available/i)
    assert.equal((await first.getProduct(line.id)).stock[39], before - 1)
    const email = `${randomUUID()}@example.test`
    assert.equal(await first.subscribe(email.toUpperCase()), true)
    assert.equal(await second.subscribe(email), false)
  } finally { await Promise.all([first.close(), second.close()]) }
})
