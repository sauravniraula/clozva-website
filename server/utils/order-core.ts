import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import { currency, productSeeds, shippingFor, sizes } from '../../shared/catalog.ts'
import type { CartItem, Customer, Receipt, ReceiptLine } from '../../shared/catalog.ts'

export type OrderInput = { requestId: string; customer: Customer; items: CartItem[] }
export class StoreConflict extends Error {}
export const openingStock = (size: number) => size === 44 ? 4 : 12

export function readReceipt(json: string): Receipt {
  const receipt: Omit<Receipt, 'currency'> & { currency?: Receipt['currency'] } = JSON.parse(json)
  // Orders saved before the U.S. storefront used whole rupees, not cents.
  return { ...receipt, currency: receipt.currency ?? 'NPR' }
}

export function authorizeReceipt(json: string, token: string): Receipt | undefined {
  const receipt = readReceipt(json)
  const left = Buffer.from(receipt.token)
  const right = Buffer.from(token)
  if (left.length === right.length && timingSafeEqual(left, right)) return receipt
}

export function prepareOrder(customer: Customer, items: CartItem[]) {
  const merged = new Map<string, CartItem>()
  for (const { id, size, quantity } of items) {
    const key = `${id}/${size}`
    merged.set(key, { id, size, quantity: quantity + (merged.get(key)?.quantity ?? 0) })
  }
  // Stable order both canonicalizes retries and keeps inventory row locks ordered.
  const lines = [...merged.values()].sort((a, b) => a.id.localeCompare(b.id) || a.size - b.size)
  if (lines.length === 0 || lines.some(line => !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 12)) {
    throw new StoreConflict('Choose between 1 and 12 pairs of each size.')
  }
  const fingerprint = createHash('sha256').update(JSON.stringify({ customer, lines })).digest('hex')
  return { fingerprint, lines }
}

export function retryReceipt(previous: { fingerprint: string; receipt: string }, fingerprint: string): Receipt {
  if (previous.fingerprint !== fingerprint) throw new StoreConflict('This request was used for a different checkout.')
  return readReceipt(previous.receipt)
}

export function unavailable(line: CartItem): StoreConflict {
  const product = productSeeds.find(p => p.id === line.id)
  const label = product ? `${product.name} in ${product.color}, EU ${line.size}` : 'An item in your bag'
  return new StoreConflict(`${label} is not available in the requested quantity.`)
}

export function buildReceipt(lines: CartItem[]): Receipt {
  const items: ReceiptLine[] = lines.map(line => {
    const product = productSeeds.find(p => p.id === line.id)
    if (!product || !sizes.includes(line.size)) throw unavailable(line)
    return { ...line, name: product.name, color: product.color, image: product.image, price: product.price }
  })
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = shippingFor(subtotal)
  return { id: `CZ-${randomUUID().slice(0, 12).toUpperCase()}`, token: randomUUID(), placedAt: new Date().toISOString(), currency, items, subtotal, shipping, total: subtotal + shipping }
}
