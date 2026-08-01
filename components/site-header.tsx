import { Home } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="size-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Rent<span className="text-primary">IA</span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#simulador" className="transition-colors hover:text-foreground">
            Simulador
          </a>
          <a href="#precios" className="transition-colors hover:text-foreground">
            Precios por zona
          </a>
          <a href="#contrato" className="transition-colors hover:text-foreground">
            Analizar contrato
          </a>
        </nav>
        <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          Track Finanzas · shippe.ar
        </span>
      </div>
    </header>
  )
}
