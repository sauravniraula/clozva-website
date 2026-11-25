import { z } from 'zod'
import { usStates } from '../../shared/us-states.ts'

export const orderSchema = z.object({
  requestId: z.uuid(),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().max(254).pipe(z.email()).transform(email => email.toLowerCase()),
    phone: z.string().trim().min(7).max(25).regex(/^[+\d\s().-]+$/).refine(value => value.replace(/\D/g, '').length >= 7),
    address: z.string().trim().min(5).max(200),
    address2: z.string().trim().max(100).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().toUpperCase().refine(state => Object.hasOwn(usStates, state)),
    postalCode: z.string().trim().regex(/^\d{5}(?:-\d{4})?$/),
    country: z.literal('US'),
  }),
  items: z.array(z.object({ id: z.string().min(1).max(64), size: z.number().int().min(30).max(50), quantity: z.number().int().min(1).max(12) })).min(1).max(60),
})