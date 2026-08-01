import type { Metadata } from 'next'
import { PageShell } from '@/components/page-shell'
import { RentSimulator } from '@/components/rent-simulator'

export const metadata: Metadata = {
  title: 'Simulador de ajuste de alquiler | RentIA',
  description:
    'Proyectá cuánto vas a pagar de alquiler mes a mes con los índices reales del BCRA (ICL, CER, UVA).',
}

export default async function SimuladorPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <RentSimulator />
      </div>
    </PageShell>
  )
}
