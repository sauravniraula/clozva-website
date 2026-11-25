import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { productSeeds, sizes } from '../../shared/catalog.ts'
import type { Product, Receipt } from '../../shared/catalog.ts'
import { authorizeReceipt, buildReceipt, openingStock, prepareOrder, retryReceipt, unavailable } from './order-core.ts'
import type { OrderInput } from './order-core.ts'

export function openStore(path: string) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const db = new DatabaseSync(path)
  db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS inventory (id TEXT, size INTEGER, quantity INTEGER NOT NULL CHECK(quantity >= 0), PRIMARY KEY(id,size));
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL, customer TEXT NOT NULL, receipt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS subscribers (email TEXT PRIMARY KEY, created_at TEXT NOT NULL);`)
  const seed = db.prepare('INSERT OR IGNORE INTO inventory VALUES (?, ?, ?)')
  const inventory = db.prepare('SELECT size, quantity FROM inventory WHERE id = ?')
  const decrement = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ? AND size = ? AND quantity >= ?')
  const findRequest = db.prepare('SELECT fingerprint, receipt FROM orders WHERE request_id = ?')
  const findOrder = db.prepare('SELECT receipt FROM orders WHERE id = ?')
  const saveOrder = db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?)')
  const addSubscriber = db.prepare('INSERT OR IGNORE INTO subscribers VALUES (?, ?)')

  function transaction<T>(work: () => T) {
    db.exec('BEGIN IMMEDIATE')
    try { const result = work(); db.exec('COMMIT'); return result }
    catch (error) { db.exec('ROLLBACK'); throw error }
  }

  transaction(() => {
    for (const product of productSeeds) for (const size of sizes) seed.run(product.id, size, openingStock(size))
  })

  function withStock(product: typeof productSeeds[number]): Product {
    return { ...product, stock: Object.fromEntries(inventory.all(product.id).map(row => [String(row.size), Number(row.quantity)])) }
  }

  return {
    listProducts: () => productSeeds.map(withStock),
    getProduct(id: string) {
      const product = productSeeds.find(p => p.id === id)
      return product && withStock(product)
    },
    placeOrder({ requestId, customer, items }: OrderInput): Receipt {
      const { fingerprint, lines } = prepareOrder(customer, items)
      return transaction(() => {
        const previous = findRequest.get(requestId)
        if (previous) return retryReceipt({ fingerprint: String(previous.fingerprint), receipt: String(previous.receipt) }, fingerprint)
        const receipt = buildReceipt(lines)
        for (const line of lines) {
          if (decrement.run(line.quantity, line.id, line.size, line.quantity).changes !== 1) throw unavailable(line)
        }
        saveOrder.run(receipt.id, requestId, fingerprint, JSON.stringify(customer), JSON.stringify(receipt))
        return receipt
      })
    },
    getReceipt(id: string, token: string): Receipt | undefined {
      const row = findOrder.get(id)
      return row ? authorizeReceipt(String(row.receipt), token) : undefined
    },
    subscribe(email: string) { return addSubscriber.run(email.trim().toLowerCase(), new Date().toISOString()).changes === 1 },
    close: () => db.close(),
  }
}
