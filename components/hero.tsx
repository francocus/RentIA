import Link from 'next/link'
import { ArrowRight, FileSearch, LineChart, ListChecks, MapPin } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

const cuadros = [
  {
    icon: FileSearch,
    titulo: 'Revisá tu contrato',
    texto:
      'Subí el contrato en PDF o como imagen. Te explicamos en palabras simples qué puntos revisar, qué condiciones podrían perjudicarte y si hubo cambios recientes en la normativa.',
    boton: 'Revisar mi contrato',
    href: '/contrato',
  },
  {
    icon: ListChecks,
    titulo: 'Evaluá las condiciones',
    texto:
      'Contanos qué te piden para alquilar y evaluá si las condiciones son razonables antes de avanzar.',
    boton: 'Evaluar condiciones',
    href: '/condiciones',
  },
  {
    icon: MapPin,
    titulo: 'Compará el precio por zona',
    texto:
      'Ingresá los datos del alquiler y descubrí si el precio está por debajo, dentro o por encima de los valores habituales de la zona.',
    boton: 'Comparar precio',
    href: '/precios',
  },
]

export function Hero() {
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Alquilar en Rosario, con información
          </span>
          <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Evaluá tu próximo alquiler antes de decidir
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Revisá el contrato, conocé si hubo cambios en las leyes y compará las condiciones y el
            precio con otros alquileres de Rosario.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {cuadros.map((c) => (
            <div
              key={c.titulo}
              className="flex flex-col rounded-xl border border-border bg-card p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-card-foreground">{c.titulo}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{c.texto}</p>
              <Link href={c.href} className={buttonVariants({ className: 'mt-5 w-full' })}>
                {c.boton}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>

        <Link
          href="/simulador"
          className="group mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LineChart className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-card-foreground">Proyectá cuánto podrías pagar</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Calculá cómo podría cambiar tu alquiler en los próximos meses según el índice y la
                frecuencia de actualización.
              </p>
            </div>
          </div>
          <ArrowRight
            className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  )
}
