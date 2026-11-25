export default defineEventHandler(async (event) => {
  const product = await getStoreProduct(getRouterParam(event, 'id') || '')
  if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  return product
})