import { categories } from '#shared/catalog'

export default defineEventHandler(async (event) => {
  const { category, q, sort, featured, sale } = getQuery(event)
  const query = typeof q === 'string' ? q.trim().toLowerCase().slice(0, 100) : ''
  const products = (await listStoreProducts()).filter(product => {
    const categoryName = categories.find(entry => entry.id === product.category)?.title
    return (!category || product.category === category)
      && (featured !== '1' || product.featured)
      && (sale !== '1' || product.compareAt !== undefined)
      && (!query || `${product.name} ${product.color} ${categoryName} ${product.charms || ''}`.toLowerCase().includes(query))
  })
  if (sort === 'price-asc') products.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') products.sort((a, b) => b.price - a.price)
  return products
})