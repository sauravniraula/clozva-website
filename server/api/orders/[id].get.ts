export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const receipt = await (await requireStore()).getReceipt(getRouterParam(event, 'id') || '', getHeader(event, 'x-receipt-token') || '')
  if (!receipt) throw createError({ statusCode: 404, statusMessage: 'Receipt not found' })
  const { token: _token, ...details } = receipt
  return details
})