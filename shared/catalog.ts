export const categories = [
  { id: 'classic', name: 'Classics', number: '01', title: 'The Classics', description: 'The everyday original. Light, breathable, and easy to wear.', image: 'classic-sage', tone: 'sage' },
  { id: 'platform', name: 'Platforms', number: '02', title: 'The Platforms', description: 'A little extra height without the extra weight.', image: 'stack-oat', tone: 'sand' },
  { id: 'trail', name: 'Trail', number: '03', title: 'The Trail Edit', description: 'Deep tread and a secure strap for days that go off route.', image: 'trail-ink', tone: 'gray' },
  { id: 'charm', name: 'Charm Edit', number: '04', title: 'The Charm Edit', description: 'Our classic clog with a set of colorful charms already clipped in.', image: 'charm-oat', tone: 'rose' },
] as const

export type CategoryId = typeof categories[number]['id']
export type ProductSeed = { id: string; name: string; category: CategoryId; color: string; hex: string; price: number; compareAt?: number; image: string; badge?: string; featured?: boolean; description: string; charms?: string }
export type Product = ProductSeed & { stock: Record<string, number> }
export type CartItem = { id: string; size: number; quantity: number }
export type Customer = { name: string; email: string; phone: string; address: string; address2?: string; city: string; state: string; postalCode: string; country: 'US' }
export type ReceiptLine = CartItem & { name: string; color: string; price: number; image: string }
export const currency = 'USD'
export type Receipt = { id: string; token: string; placedAt: string; currency: typeof currency | 'NPR'; items: ReceiptLine[]; subtotal: number; shipping: number; total: number }
export const sizes = [36, 37, 38, 39, 40, 41, 42, 43, 44]
// Current prices and totals are stored as integer U.S. cents.
export const freeShipping = 7500
export const shippingFee = 695
export const shippingFor = (subtotal: number) => subtotal === 0 || subtotal >= freeShipping ? 0 : shippingFee
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency })
const legacy = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NPR', currencyDisplay: 'code', maximumFractionDigits: 0 })
export const money = (value: number, denomination: Receipt['currency'] = currency) => denomination === currency ? usd.format(value / 100) : legacy.format(value)
export const productImage = (id: string) => `/images/${id}.webp`

const classic = 'Our original slip-on. Soft molded foam, an airy perforated upper, and a pivoting heel strap that lets you switch between laid-back and locked in.'
const stack = 'A sculpted platform with an unexpectedly light feel. An elevated sole, airy upper, and pivoting heel strap turn your everyday clog into a statement.'
const trail = 'A rugged clog with deep, grippy tread and a pivoting heel strap. Built for turns off the pavement or just a longer way home.'
const charm = 'Our light, breathable classic with colorful clip-in charms already fitted to the upper. Wear them as they come or move the charms to any of the open ports.'

export const productSeeds: ProductSeed[] = [
  { id: 'classic-lime', name: 'The Classic Clog', category: 'classic', color: 'Electric Lime', hex: '#C6EF53', price: 3900, image: 'classic-lime', badge: 'BESTSELLER', featured: true, description: classic },
  { id: 'classic-sage', name: 'The Classic Clog', category: 'classic', color: 'Soft Sage', hex: '#B5C6B0', price: 3900, image: 'classic-sage', featured: true, description: classic },
  { id: 'stack-oat', name: 'The Stack Clog', category: 'platform', color: 'Oat Milk', hex: '#e6d6b9', price: 4900, image: 'stack-oat', badge: 'NEW', featured: true, description: stack },
  { id: 'trail-ink', name: 'The Trail Clog', category: 'trail', color: 'Midnight', hex: '#262622', price: 5500, image: 'trail-ink', featured: true, description: trail },
  { id: 'charm-lime', name: 'The Charm Clog', category: 'charm', color: 'Electric Lime', hex: '#C6EF53', price: 4400, compareAt: 5200, image: 'charm-lime', featured: true, description: charm, charms: 'Pop Mix · Lightning bolt, smiley, star, cloud, and checkerboard.' },
  { id: 'charm-oat', name: 'The Charm Clog', category: 'charm', color: 'Oat Milk', hex: '#e6d6b9', price: 5200, image: 'charm-oat', badge: 'NEW', featured: true, description: charm, charms: 'Sweet Mix · Bow, strawberry, daisy, smiley, and sparkle.' },
  { id: 'charm-sage', name: 'The Charm Clog', category: 'charm', color: 'Soft Sage', hex: '#B5C6B0', price: 5200, image: 'charm-sage', description: charm, charms: 'Daydream Mix · Mushroom, daisy, butterfly, sun, and seashell.' },
  { id: 'classic-oat', name: 'The Classic Clog', category: 'classic', color: 'Oat Milk', hex: '#e6d6b9', price: 3200, compareAt: 3900, image: 'classic-oat', description: classic },
  { id: 'classic-ink', name: 'The Classic Clog', category: 'classic', color: 'Midnight', hex: '#262622', price: 3900, image: 'classic-ink', description: classic },
  { id: 'stack-ink', name: 'The Stack Clog', category: 'platform', color: 'Midnight', hex: '#262622', price: 4200, compareAt: 4900, image: 'stack-ink', description: stack },
  { id: 'trail-sage', name: 'The Trail Clog', category: 'trail', color: 'Soft Sage', hex: '#B5C6B0', price: 5500, image: 'trail-sage', description: trail },
]
