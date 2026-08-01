import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscription } from '@/lib/db/schema'
import { getSessionUserFromRequest } from '@/lib/session'
import {
  X402_CHAIN_ID,
  X402_FACILITATOR_URL,
  X402_PLAN_DAYS,
  X402_PRICE,
  X402_USDC_ADDRESS,
  x402Recipient,
} from '@/lib/x402'

type Payment = {
  token?: string
  payload?: {
    authorization?: {
      from?: string
      to?: string
      value?: string
      validAfter?: number
      validBefore?: number
      nonce?: string
    }
    signature?: string
  }
}

export function GET() {
  try {
    return Response.json({
      chainId: X402_CHAIN_ID,
      token: X402_USDC_ADDRESS,
      recipient: x402Recipient(),
      value: X402_PRICE,
      amount: '20 USDC',
    })
  } catch {
    return Response.json({ error: 'Los pagos con USDC todavía no están configurados.' }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const user = await getSessionUserFromRequest(req)
  if (!user || (user as { role?: string }).role !== 'inmobiliaria') {
    return Response.json({ error: 'Necesitás una cuenta de inmobiliaria.' }, { status: 401 })
  }

  try {
    const { paymentPayload, paymentRequirements } = (await req.json()) as {
      paymentPayload?: Payment
      paymentRequirements?: { chainId?: number }
    }
    const authorization = paymentPayload?.payload?.authorization
    const recipient = x402Recipient()
    const now = Math.floor(Date.now() / 1000)
    const validAfter = authorization?.validAfter
    const validBefore = authorization?.validBefore

    if (
      paymentPayload?.token?.toLowerCase() !== X402_USDC_ADDRESS ||
      paymentRequirements?.chainId !== X402_CHAIN_ID ||
      authorization?.to?.toLowerCase() !== recipient.toLowerCase() ||
      authorization.value !== X402_PRICE ||
      !/^0x[a-fA-F0-9]{40}$/.test(authorization.from ?? '') ||
      !/^0x[a-fA-F0-9]{64}$/.test(authorization.nonce ?? '') ||
      !/^0x[a-fA-F0-9]{130}$/.test(paymentPayload?.payload?.signature ?? '') ||
      !Number.isInteger(validAfter) ||
      !Number.isInteger(validBefore) ||
      validAfter! > now + 60 ||
      validBefore! < now ||
      validBefore! > now + 15 * 60
    ) {
      return Response.json({ error: 'El pago no cumple los requisitos del plan.' }, { status: 400 })
    }

    const body = { paymentPayload, paymentRequirements: { chainId: X402_CHAIN_ID } }
    const verified = await fetch(`${X402_FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const verification = (await verified.json()) as { isValid?: boolean; invalidReason?: string }
    if (!verified.ok || !verification.isValid) {
      return Response.json({ error: verification.invalidReason ?? 'No se pudo verificar el pago.' }, { status: 400 })
    }

    const settled = await fetch(`${X402_FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const settlement = (await settled.json()) as { success?: boolean; transaction?: string; errorReason?: string }
    if (!settled.ok || !settlement.success || !settlement.transaction) {
      return Response.json({ error: settlement.errorReason ?? 'No se pudo liquidar el pago.' }, { status: 400 })
    }

    const [existing] = await db.select().from(subscription).where(eq(subscription.userId, user.id))
    const periodStart = existing?.currentPeriodEnd && existing.currentPeriodEnd > new Date() ? existing.currentPeriodEnd : new Date()
    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodEnd.getDate() + X402_PLAN_DAYS)
    const data = {
      status: 'active',
      currentPeriodEnd: periodEnd,
      stripeCustomerId: authorization.from!.toLowerCase(),
      stripeSubscriptionId: settlement.transaction,
      stripePriceId: 'x402-usdc-20',
      updatedAt: new Date(),
    }

    if (existing) {
      await db.update(subscription).set(data).where(and(eq(subscription.userId, user.id), eq(subscription.id, existing.id)))
    } else {
      await db.insert(subscription).values({ id: crypto.randomUUID(), userId: user.id, ...data })
    }

    return Response.json({ transaction: settlement.transaction, currentPeriodEnd: periodEnd })
  } catch (error) {
    console.error('[x402-activate-subscription]', error)
    return Response.json({ error: 'No se pudo activar el plan. Intentá nuevamente.' }, { status: 500 })
  }
}
