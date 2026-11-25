import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { openStore } from '../server/utils/store.ts'

const customer = { name: 'Test Shopper', email: 'shopper@example.test', phone: '415-555-0134', address: '1 Test Lane', city: 'San Francisco', state: 'CA', postalCode: '94103', country: 'US' }
const cart = [{ id: 'classic-lime', size: 39, quantity: 2, price: 1 }]

function fixture(run) {
  const dir = mkdtempSync(join(tmpdir(), 'clozva-test-'))
  const path = join(dir, 'store.sqlite')
  const store = openStore(path)
  try { run(store, path) } finally { store.close(); rmSync(dir, { recursive: true, force: true }) }
}

test('checkout uses server prices and the saved receipt survives reopening the database', () => fixture((store, path) => {
  const order = store.placeOrder({ requestId: '11111111-1111-4111-8111-111111111111', customer, items: cart })
  assert.equal(order.currency, 'USD')
  assert.equal(order.subtotal, 7800)
  assert.equal(order.shipping, 0)
  assert.equal(order.total, 7800)
  const reopened = openStore(path)
  try { assert.deepEqual(reopened.getReceipt(order.id, order.token), order) } finally { reopened.close() }
  assert.equal(store.getReceipt(order.id, 'incorrect'), undefined)
}))

test('checkout rejects unavailable sizes without decrementing inventory and charges shipping below threshold', () => fixture((store) => {
  const before = store.getProduct('classic-lime').stock[39]
  assert.throws(() => store.placeOrder({ requestId: '11111111-1111-4111-8111-111111111111', customer, items: [...cart, { id: 'classic-lime', size: 99, quantity: 1 }] }), /not available/i)
  assert.equal(store.getProduct('classic-lime').stock[39], before)
  const order = store.placeOrder({ requestId: '22222222-2222-4222-8222-222222222222', customer, items: [{ ...cart[0], quantity: 1 }] })
  assert.equal(order.shipping, 695)
  assert.equal(order.total, 4595)
  assert.equal(store.getProduct('classic-lime').stock[39], before - 1)
}))

test('retrying the same checkout returns one receipt and does not double-decrement stock', () => fixture((store) => {
  const input = { requestId: '11111111-1111-4111-8111-111111111111', customer, items: cart }
  const before = store.getProduct('classic-lime').stock[39]
  assert.deepEqual(store.placeOrder(input), store.placeOrder(input))
  assert.equal(store.getProduct('classic-lime').stock[39], before - 2)
  assert.throws(() => store.placeOrder({ ...input, items: [{ ...cart[0], size: 40 }] }), /different checkout/i)
}))

test('newsletter subscriptions normalize addresses and do not duplicate them', () => fixture((store) => {
  assert.equal(store.subscribe('HELLO@example.test'), true)
  assert.equal(store.subscribe('hello@example.test'), false)
}))

test('an existing receipt without currency keeps its original denomination', () => fixture((store, path) => {
  const { currency, ...legacy } = store.placeOrder({ requestId: '11111111-1111-4111-8111-111111111111', customer, items: cart })
  legacy.total = 5980
  const db = new DatabaseSync(path)
  try { db.prepare('UPDATE orders SET receipt = ? WHERE id = ?').run(JSON.stringify(legacy), legacy.id) } finally { db.close() }
  const receipt = store.getReceipt(legacy.id, legacy.token)
  assert.equal(receipt.currency, 'NPR')
  assert.equal(receipt.total, 5980)
}))
