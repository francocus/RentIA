import 'server-only'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscription } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type SubscriptionStatus = {
  role: string
  isInmobiliaria: boolean
  hasActiveSub: boolean
  sub: typeof subscription.$inferSelect | null
}

export function isDemoPremiumUser(email?: string | null) {
  if (!email) return false
  return (process.env.DEMO_PREMIUM_EMAILS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .includes(email.trim().toLowerCase())
}

/** Devuelve el rol y estado de suscripción del usuario actual. */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { role: 'inquilino', isInmobiliaria: false, hasActiveSub: false, sub: null }
  }

  const role = (session.user as any).role ?? 'inquilino'
  const isDemo = isDemoPremiumUser(session.user.email)

  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, session.user.id))

  const hasActiveSub = sub?.status === 'active' || sub?.status === 'trialing'

  return {
    role,
    isInmobiliaria: isDemo || (role === 'inmobiliaria' && hasActiveSub),
    hasActiveSub: hasActiveSub || isDemo,
    sub: sub ?? null,
  }
}
