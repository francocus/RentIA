import { PageShell } from '@/components/page-shell'
import { PriceCompare } from '@/components/price-compare'

export const metadata = {
  title: 'Precios por zona — RentIA',
  description: 'Compará el precio de un alquiler con los valores habituales por barrio de Rosario.',
}

export default function PreciosPage() {
  return (
    <PageShell active="precios">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            Compará el precio por zona
          </h1>
          <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
            Ingresá los datos del alquiler y descubrí si el precio está por debajo, dentro o por
            encima de los valores habituales de la zona en Rosario.
          </p>
        </div>
        <PriceCompare />
      </div>
    </PageShell>
  )
}
