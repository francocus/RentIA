import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Building2, Check, Lock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getSubscriptionStatus } from '@/lib/subscription'
import { buttonVariants } from '@/components/ui/button'
import { createCheckoutSession } from '@/app/actions/stripe'

const incluido = [
  'Análisis de postulantes con IA ilimitado',
  'Detección automática de documentos faltantes',
  'Informes con observaciones y recomendaciones',
  'Verificación contra legislación vigente',
  'Historial de análisis guardado',
  'Soporte por email',
]

export default async function UpgradePage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) redirect('/sign-up/inmobiliaria')

  const { isInmobiliaria } = await getSubscriptionStatus()
  if (isInmobiliaria) redirect('/inmobiliaria')

  return (
    <main className="flex min-h-svh items-start justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground">
            Activá tu plan Inmobiliaria
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
            Hola, <strong className="text-foreground">{session.user.name}</strong>. Tu cuenta está
            creada. Ahora activá la suscripción para desbloquear el analizador de postulantes.
          </p>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" aria-hidden="true" />
                <span className="font-semibold text-card-foreground">Plan Inmobiliaria</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">$9.900</span>
                <span className="text-sm text-muted-foreground">ARS / mes</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Primeros 7 días gratis. Cancelá cuando quieras.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {incluido.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>

          <form action={createCheckoutSession} className="mt-8">
            <button
              type="submit"
              className={buttonVariants({ size: 'lg', className: 'w-full' })}
            >
              Activar plan — 7 días gratis
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Pago seguro vía Stripe. Podés cancelar en cualquier momento.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  )
}
