import { test } from 'node:test'
import assert from 'node:assert/strict'
import { orderSchema } from '../server/utils/order-schema.ts'

const order = {
  requestId: '11111111-1111-4111-8111-111111111111',
  customer: { name: 'Test Shopper', email: 'shopper@example.test', phone: '415-555-0134', address: '1 Test Lane', address2: 'Apt 4', city: 'San Francisco', state: 'CA', postalCode: '94103-1234', country: 'US' },
  items: [{ id: 'classic-lime', size: 39, quantity: 1 }],
}

test('checkout accepts a U.S. address with ZIP+4 and an optional apartment', () => {
  assert.deepEqual(orderSchema.parse(order).customer, order.customer)
  assert.ok(orderSchema.safeParse({ ...order, customer: { ...order.customer, address2: undefined, postalCode: '94103' } }).success)
})

test('checkout rejects non-U.S. destinations and missing or malformed state and ZIP', () => {
  for (const invalid of [{ country: 'CA' }, { state: undefined }, { state: 'XX' }, { postalCode: 'ABC1' }]) {
    assert.equal(orderSchema.safeParse({ ...order, customer: { ...order.customer, ...invalid } }).success, false)
  }
})