import pg from 'pg'
import { productSeeds, sizes } from '../../shared/catalog.ts'
import type { Product } from '../../shared/catalog.ts'
import { authorizeReceipt, buildReceipt, openingStock, prepareOrder, retryReceipt, unavailable } from './order-core.ts'
import type { OrderInput } from './order-core.ts'

export function openPostgresStore(connectionString: string) {
  const pool = new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000, allowExitOnIdle: true })
  pool.on('error', () => console.error('CLOZVA: idle PostgreSQL connection failed'))
  async function transaction<T>(work: (client: pg.PoolClient) => Promise<T>) {
    const client = await pool.connect()
    let discard = false
    try {
      await client.query('BEGIN')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      try { await client.query('ROLLBACK') } catch { discard = true }
      throw error
    } finally { client.release(discard) }
  }

  let ready: Promise<void> | undefined
  function initialize() {
    return ready ??= transaction(async (client) => {
      // Prevent concurrent cold starts from racing to create the same tables.
      await client.query('SELECT pg_advisory_xact_lock(93650713, 1)')
      await client.query(`CREATE TABLE IF NOT EXISTS clozva_inventory (id text, size integer, quantity integer NOT NULL CHECK(quantity >= 0), PRIMARY KEY(id,size));
        CREATE TABLE IF NOT EXISTS clozva_orders (id text PRIMARY KEY, request_id uuid NOT NULL UNIQUE, fingerprint text NOT NULL, customer text NOT NULL, receipt text NOT NULL);
        CREATE TABLE IF NOT EXISTS clozva_subscribers (email text PRIMARY KEY, created_at timestamptz NOT NULL);`)
      const slots = productSeeds.flatMap(product => sizes.map(size => ({ id: product.id, size, quantity: openingStock(size) })))
      await client.query(`INSERT INTO clozva_inventory (id, size, quantity)
        SELECT id, size, quantity FROM unnest($1::text[], $2::int[], $3::int[]) AS slots(id, size, quantity)
        ON CONFLICT DO NOTHING`, [slots.map(s => s.id), slots.map(s => s.size), slots.map(s => s.quantity)])
    }).catch((error) => { ready = undefined; throw error })
  }

  async function listProducts(id?: string): Promise<Product[]> {
    await initialize()
    const { rows } = id === undefined
      ? await pool.query('SELECT id, size, quantity FROM clozva_inventory')
      : await pool.query('SELECT id, size, quantity FROM clozva_inventory WHERE id = $1', [id])
    const stock = new Map<string, Record<string, number>>()
    for (const row of rows) {
      if (!stock.has(row.id)) stock.set(row.id, {})
      stock.get(row.id)![row.size] = row.quantity
    }
    return productSeeds.filter(product => id === undefined || product.id === id).map(product => ({ ...product, stock: stock.get(product.id) ?? {} }))
  }

  return {
    listProducts: () => listProducts(),
    async getProduct(id: string) { return (await listProducts(id))[0] },
    async placeOrder({ requestId, customer, items }: OrderInput) {
      const { fingerprint, lines } = prepareOrder(customer, items)
      await initialize()
      return transaction(async (client) => {
        // Serialize retries using the same request ID across separate workers.
        await client.query('SELECT pg_advisory_xact_lock(93650714, hashtext($1))', [requestId])
        const previous = (await client.query('SELECT fingerprint, receipt FROM clozva_orders WHERE request_id = $1', [requestId])).rows[0]
        if (previous) return retryReceipt(previous, fingerprint)
        const receipt = buildReceipt(lines)
        for (const line of lines) {
          const result = await client.query('UPDATE clozva_inventory SET quantity = quantity - $1 WHERE id = $2 AND size = $3 AND quantity >= $1', [line.quantity, line.id, line.size])
          if (result.rowCount !== 1) throw unavailable(line)
        }
        await client.query('INSERT INTO clozva_orders (id, request_id, fingerprint, customer, receipt) VALUES ($1,$2,$3,$4,$5)', [receipt.id, requestId, fingerprint, JSON.stringify(customer), JSON.stringify(receipt)])
        return receipt
      })
    },
    async getReceipt(id: string, token: string) {
      await initialize()
      const row = (await pool.query('SELECT receipt FROM clozva_orders WHERE id = $1', [id])).rows[0]
      return row ? authorizeReceipt(row.receipt, token) : undefined
    },
    async subscribe(email: string) {
      await initialize()
      const result = await pool.query('INSERT INTO clozva_subscribers (email, created_at) VALUES ($1, now()) ON CONFLICT DO NOTHING', [email.trim().toLowerCase()])
      return result.rowCount === 1
    },
    close: () => pool.end(),
  }
}
