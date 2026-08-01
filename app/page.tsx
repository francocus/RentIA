import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { RentSimulator } from '@/components/rent-simulator'
import { PriceCompare } from '@/components/price-compare'
import { ContractAnalyzer } from '@/components/contract-analyzer'

export default function Page() {
  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <Hero />
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-16">
        <RentSimulator />
        <PriceCompare />
        <ContractAnalyzer />
      </div>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">RentIA</p>
          <p className="mt-1 max-w-2xl leading-relaxed">
            MVP para shippe.ar (track Finanzas). Los valores de precios e índices son ilustrativos para la
            demo. RentIA brinda orientación y no constituye asesoramiento legal ni financiero.
          </p>
        </div>
      </footer>
    </main>
  )
}
