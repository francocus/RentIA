import Link from 'next/link'
import { ArrowRight, Building2, ClipboardCheck, Clock, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { PageShell } from '@/components/page-shell'

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

export default function InmobiliariaPage() {
  return (
    <PageShell>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Building2 className="size-3.5" aria-hidden="true" />
              Para inmobiliarias
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
              <Link
                href="/"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Volver al inicio
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

          <div className="mt-4 rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-card-foreground">
                  ¿Cómo funciona?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Ingresá los datos del postulante, marcá los documentos recibidos y presioná
                  &ldquo;Analizar con IA&rdquo;. En segundos tenés un resumen del expediente con
                  observaciones y recomendaciones.
                </p>
              </div>
              <Link
                href="/inmobiliaria/postulante"
                className={buttonVariants({ className: 'mt-4 shrink-0 md:mt-0' })}
              >
                Empezar ahora
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
