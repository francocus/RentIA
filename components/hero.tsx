import { FileSearch, LineChart, MapPin } from 'lucide-react'

const features = [
  {
    icon: FileSearch,
    title: 'Entendé tu contrato',
    desc: 'La IA lee el contrato y te explica ajustes, plazos y cláusulas riesgosas en criollo.',
    href: '#contrato',
  },
  {
    icon: MapPin,
    title: 'Compará precios por zona',
    desc: 'Fijate si lo que te piden está en línea con el mercado del barrio de Rosario que elegís.',
    href: '#precios',
  },
  {
    icon: LineChart,
    title: 'Simulá los ajustes',
    desc: 'Proyectá cuánto vas a pagar mes a mes según el índice de actualización.',
    href: '#simulador',
  },
]

export function Hero() {
  return (
    <section id="top" className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Alquilar en Rosario, con datos
          </span>
          <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Alquilá con información, no a ciegas
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            RentIA centraliza todo lo que necesitás antes de firmar en Rosario: entendé el contrato,
            conocé los valores reales del mercado rosarino y anticipá cuánto va a subir tu alquiler.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <a
              key={f.title}
              href={f.href}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-semibold text-card-foreground">{f.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
