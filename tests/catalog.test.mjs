import { test } from 'node:test'
import assert from 'node:assert/strict'
import { money, productSeeds, shippingFor } from '../shared/catalog.ts'

test('sale styles have a real price below their original price', () => {
  const discounted = productSeeds.filter(product => product.compareAt !== undefined)
  assert.ok(discounted.length >= 2, 'Expected at least two sale styles')
  assert.ok(discounted.every(product => product.compareAt > product.price))
})

test('USD formatting and domestic shipping work in integer cents', () => {
  assert.equal(money(3900), '$39.00')
  assert.equal(money(695), '$6.95')
  assert.equal(shippingFor(7499), 695)
  assert.equal(shippingFor(7500), 0)
})
