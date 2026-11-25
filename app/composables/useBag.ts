import type { CartItem, Product } from '#shared/catalog'

const storageKey = 'clozva:bag:v1'
export const bagKey = (line: Pick<CartItem, 'id' | 'size'>) => `${line.id}/${line.size}`

export function useBag() {
  const items = useState<CartItem[]>('bag-items', () => [])
  const isOpen = useState('bag-open', () => false)
  const ready = useState('bag-ready', () => false)
  const count = computed(() => items.value.reduce((sum, line) => sum + line.quantity, 0))

  function restore() {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]')
      if (Array.isArray(saved)) items.value = saved.filter(line => typeof line?.id === 'string' && Number.isInteger(line.size) && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 12)
    } catch { /* Browser storage may be unavailable. */ }
    ready.value = true
  }
  function set(id: string, size: number, quantity: number) {
    const next = items.value.filter(line => line.id !== id || line.size !== size)
    if (quantity > 0) next.push({ id, size, quantity: Math.min(quantity, 12) })
    items.value = next
    save()
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(items.value)) } catch { /* Still available in memory. */ }
  }
  function add(product: Product, size: number, amount = 1) {
    const quantity = items.value.find(line => line.id === product.id && line.size === size)?.quantity ?? 0
    if (!Number.isInteger(amount) || amount < 1 || quantity + amount > Math.min(12, product.stock[size] ?? 0)) return false
    set(product.id, size, quantity + amount)
    isOpen.value = true
    return true
  }
  function clear() { items.value = []; save() }
  return { items, isOpen, ready, count, restore, set, add, clear }
}

export function useBagLines() {
  const { items } = useBag()
  const { data, refresh, status } = useFetch<Product[]>('/api/products', { key: 'bag-catalog', default: () => [] })
  const lines = computed(() => items.value.flatMap(line => {
    const product = data.value.find(product => product.id === line.id)
    return product ? [{ ...line, product }] : []
  }))
  const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.product.price * line.quantity, 0))
  return { lines, subtotal, refresh, status }
}