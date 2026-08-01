import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Check, Lock, ShieldCheck } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getSubscriptionStatus } from '@/lib/subscription'
import { DemoCheckoutForm } from '@/components/inmobiliaria/demo-checkout-form'

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
    <main className="min-h-svh bg-background px-4 py-16">
      <div className="mx-auto grid w-full max-w-4xl gap-8 lg:grid-cols-[1fr_1.1fr]">

        {/* ── Columna izquierda: plan info ── */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" aria-hidden="true" />
              <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Plan Inmobiliaria
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-5xl font-extrabold tracking-tight text-foreground">$9.900</span>
              <span className="text-base text-muted-foreground">ARS / mes</span>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Primeros 7 días gratis &mdash; cancelá cuando quieras.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Incluido en el plan
            </p>
            <ul className="flex flex-col gap-2.5">
              {incluido.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Hola, <strong className="text-foreground">{session.user.name}</strong>. Tu cuenta ya
            está creada. Solo falta activar el plan.
          </div>
        </div>

        {/* ── Columna derecha: checkout form ── */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-muted-foreground">Datos de pago</p>
          </div>
          <DemoCheckoutForm />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Esta es una demo. No se realizará ningún cobro real.
          </p>
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  )
}
