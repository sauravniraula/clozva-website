import { orderSchema } from '../../utils/order-schema'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const order = await readValidatedBody(event, orderSchema.parse)
  try {
    const receipt = await (await requireStore()).placeOrder(order)
    setResponseStatus(event, 201)
    return receipt
  } catch (error) {
    if (error instanceof StoreConflict) throw createError({ statusCode: 409, statusMessage: error.message })
    throw error
  }
})