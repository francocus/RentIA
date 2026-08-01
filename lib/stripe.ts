import 'server-only'
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

// Plan mensual para cuentas inmobiliaria.
export const INMOBILIARIA_PLAN = {
  id: 'plan-inmobiliaria-mensual',
  name: 'RentIA Inmobiliaria',
  description: 'Acceso completo al analizador de postulantes con IA para inmobiliarias.',
  priceInCents: 990000, // ARS $9.900/mes
  currency: 'ars',
  interval: 'month' as const,
}
