import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Building2, ClipboardCheck, Clock, CreditCard, Database, History, Sparkles } from 'lucide-react'

import { auth } from '@/lib/auth'
import { getSubscriptionStatus } from '@/lib/subscription'
import { buttonVariants } from '@/components/ui/button'
import { PageShell } from '@/components/page-shell'

import type { LucideIcon } from 'lucide-react'

function FeatureItem({ href, icon: Icon, title, desc }: { href: string; icon: LucideIcon; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </Link>
  )
}

const beneficios = [
  {
    icon: Clock,
    titulo: 'Ahorrá tiempo',
    texto: 'La IA revisa la documentación en segundos. Lo que antes llevaba minutos de revisión manual, ahora es automático.',
  },
  {
    icon: ClipboardCheck,
    titulo: 'Expediente ordenado',
    texto: 'Detecta automáticamente qué documentos faltan y resume el estado del postulante en un informe claro.',
  },
  {
    icon: Sparkles,
    titulo: 'Análisis inteligente',
    texto: 'La IA identifica inconsistencias, evalúa la solvencia y genera observaciones para facilitar la decisión.',
  },
]

export default async function InmobiliariaPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  // No está logueado → redirigir al registro de inmobiliaria
  if (!session?.user) {
    redirect('/sign-up/inmobiliaria')
  }

  const { isInmobiliaria, hasActiveSub, role } = await getSubscriptionStatus()

  // Tiene cuenta pero no suscripción activa → redirigir al upgrade
  if (!isInmobiliaria) {
    redirect('/inmobiliaria/upgrade')
  }

  return (
    <PageShell>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Building2 className="size-3.5" aria-hidden="true" />
              Plan Inmobiliaria activo
            </span>
            <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              Automatizá el análisis de postulantes con IA
            </h1>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              RentIA ayuda a las inmobiliarias a revisar la documentación de los postulantes de
              forma rápida y ordenada, reduciendo el trabajo administrativo manual.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/inmobiliaria/postulante" className={buttonVariants({ size: 'lg' })}>
                Analizar nuevo postulante
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/inmobiliaria/historial" className={buttonVariants({ variant: 'secondary', size: 'lg' })}>
                <History className="size-4" aria-hidden="true" />
                Historial de análisis
              </Link>
              <Link href="/inmobiliaria/contratos" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                <Database className="size-4" aria-hidden="true" />
                Base de contratos
              </Link>
              <Link
                href="/inmobiliaria/upgrade"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                <CreditCard className="size-4" aria-hidden="true" />
                Gestionar suscripción
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {beneficios.map((b) => (
              <div
                key={b.titulo}
                className="flex flex-col rounded-xl border border-border bg-card p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <b.icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-card-foreground">{b.titulo}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.texto}</p>
              </div>
            ))}
          </div>

          {/* Highlight: base de contratos */}
          <Link
            href="/inmobiliaria/contratos"
            className="group mt-8 flex items-start gap-5 rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 transition-colors hover:border-primary/70 hover:bg-primary/10"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="size-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Base de contratos scaneados por inquilinos</h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">Exclusivo premium</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Accedé a todos los contratos que inquilinos de Rosario analizaron en RentIA. Filtrá por barrio, precio,
                régimen y fecha para entender el mercado real y tomar mejores decisiones comerciales.
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary transition-transform group-hover:gap-2.5">
                Explorar contratos <ArrowRight className="size-4" aria-hidden="true" />
              </p>
            </div>
          </Link>

          <div className="mt-4 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Funcionalidades incluidas en tu plan
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureItem
                href="/inmobiliaria/postulante"
                icon={Sparkles}
                title="Análisis con IA"
                desc="Evaluá nombre, ingresos, tipo de empleo y solvencia en segundos."
              />
              <FeatureItem
                href="/inmobiliaria/postulante"
                icon={ClipboardCheck}
                title="Detección de documentos"
                desc="La IA detecta automáticamente qué documentos faltan en el expediente."
              />
              <FeatureItem
                href="/inmobiliaria/postulante"
                icon={ArrowRight}
                title="Informe descargable"
                desc="Cada análisis genera un informe completo con observaciones y recomendación."
              />
              <FeatureItem
                href="/inmobiliaria/postulante"
                icon={Clock}
                title="Verificación legal"
                desc="Contrasta el expediente contra el marco legal vigente (DNU 70/2023, InfoLEG)."
              />
              <FeatureItem
                href="/inmobiliaria/historial"
                icon={History}
                title="Historial guardado"
                desc="Todos los análisis se guardan automáticamente. Accedé a ellos cuando quieras."
              />
              <FeatureItem
                href="/inmobiliaria/contratos"
                icon={Database}
                title="Base de contratos"
                desc="Accedé a contratos reales scaneados por inquilinos de Rosario para comparar condiciones."
              />
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
