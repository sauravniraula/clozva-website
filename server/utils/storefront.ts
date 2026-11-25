import { resolve } from 'node:path'
import { productSeeds, sizes } from '../../shared/catalog.ts'
import { openingStock } from './order-core'
import { openPostgresStore } from './postgres-store'
import type { openStore } from './store'

const previewCatalog = productSeeds.map(product => ({ ...product, stock: Object.fromEntries(sizes.map(size => [size, openingStock(size)])) }))
let postgres: ReturnType<typeof openPostgresStore> | undefined
let sqlite: Promise<ReturnType<typeof openStore>> | undefined

// Never write serverless orders or subscriptions to an ephemeral filesystem.
export const storageAvailable = () => Boolean(process.env.DATABASE_URL?.trim()) || (process.env.NETLIFY !== 'true' && !useRuntimeConfig().clozvaRequireDatabase)

export async function requireStore() {
  const connection = process.env.DATABASE_URL?.trim()
  if (connection) return postgres ??= openPostgresStore(connection)
  if (!storageAvailable()) throw createError({ statusCode: 503, statusMessage: 'Ordering and signups are unavailable on this preview' })
  return sqlite ??= import('./store').then(({ openStore }) => openStore(resolve(process.env.CLOZVA_DB_PATH || '.data/clozva.sqlite')))
}

export async function listStoreProducts() {
  return storageAvailable() ? (await requireStore()).listProducts() : previewCatalog
}

export async function getStoreProduct(id: string) {
  return storageAvailable() ? (await requireStore()).getProduct(id) : previewCatalog.find(product => product.id === id)
}
