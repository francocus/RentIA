'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { stripe, INMOBILIARIA_PLAN } from '@/lib/stripe'
import { db } from '@/lib/db'
import { subscription, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/** Crea (o reutiliza) el customer de Stripe y arranca el checkout de suscripción. */
export async function createCheckoutSession() {
  const userId = await getUserId()

  // Buscar suscripción existente
  const [existing] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))

  let customerId = existing?.stripeCustomerId ?? undefined

  // Crear customer en Stripe si no existe
  if (!customerId) {
    const [dbUser] = await db.select().from(user).where(eq(user.id, userId))
    const customer = await stripe.customers.create({
      email: dbUser.email,
      name: dbUser.name,
      metadata: { userId },
    })
    customerId = customer.id
  }

  const baseUrl =
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL ?? 'http://localhost:3000')

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: INMOBILIARIA_PLAN.currency,
          product_data: {
            name: INMOBILIARIA_PLAN.name,
            description: INMOBILIARIA_PLAN.description,
          },
          unit_amount: INMOBILIARIA_PLAN.priceInCents,
          recurring: { interval: INMOBILIARIA_PLAN.interval },
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/inmobiliaria/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/inmobiliaria/upgrade`,
    metadata: { userId },
  })

  redirect(session.url!)
}

/** Redirige al portal de Stripe para gestionar/cancelar la suscripción. */
export async function createPortalSession() {
  const userId = await getUserId()

  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))

  if (!sub?.stripeCustomerId) throw new Error('No subscription found')

  const baseUrl =
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.V0_RUNTIME_URL ?? 'http://localhost:3000')

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${baseUrl}/inmobiliaria`,
  })

  redirect(portal.url)
}
