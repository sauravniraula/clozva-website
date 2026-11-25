import { z } from 'zod'

const emailSchema = z.object({ email: z.string().trim().max(254).pipe(z.email()) })

export default defineEventHandler(async (event) => {
  const { email } = await readValidatedBody(event, emailSchema.parse)
  await (await requireStore()).subscribe(email)
  return { subscribed: true }
})