'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscription, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * DEMO: simula la activación del plan inmobiliaria sin procesar un pago real.
 * En producción esto se reemplaza por el checkout de Stripe + webhook.
 */
export async function activateDemoSubscription() {
  const userId = await getUserId()

  const [existing] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))

  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + 30)

  if (existing) {
    await db
      .update(subscription)
      .set({
        status: 'active',
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscription.userId, userId))
  } else {
    await db.insert(subscription).values({
      id: crypto.randomUUID(),
      userId,
      status: 'active',
      currentPeriodEnd: periodEnd,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
    })
  }

}

