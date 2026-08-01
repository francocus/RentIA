import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { subscription, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

async function upsertSubscription(
  userId: string,
  sub: Stripe.Subscription,
  customerId: string,
) {
  const [existing] = await db
    .select({ id: subscription.id })
    .from(subscription)
    .where(eq(subscription.userId, userId))

  const data = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    stripePriceId: sub.items.data[0]?.price.id ?? null,
    status: sub.status,
    currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(subscription).set(data).where(eq(subscription.userId, userId))
  } else {
    await db.insert(subscription).values({ ...data, id: crypto.randomUUID() })
  }

  // Activar / desactivar el rol inmobiliaria según el estado de la suscripción
  const isActive = sub.status === 'active' || sub.status === 'trialing'
  await db
    .update(user)
    .set({ role: isActive ? 'inmobiliaria' : 'inquilino', updatedAt: new Date() })
    .where(eq(user.id, userId))
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        if (session.mode !== 'subscription') break
        const userId = session.metadata?.userId
        if (!userId) break

        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        await upsertSubscription(userId, sub, session.customer as string)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(sub.customer as string)
        if (customer.deleted) break
        const userId = (customer as Stripe.Customer).metadata?.userId
        if (!userId) break
        await upsertSubscription(userId, sub, sub.customer as string)
        break
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
