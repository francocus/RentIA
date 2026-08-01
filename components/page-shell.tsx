import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/site-header'

export async function PageShell({
  children,
  active,
}: {
  children: ReactNode
  active?: 'contrato' | 'condiciones' | 'precios' | 'simulador'
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session?.user ?? null

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader user={user} active={active} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            Rent<span className="text-primary">IA</span>
          </p>
          <p className="mt-1 max-w-2xl leading-relaxed text-pretty">
            RentIA te da orientación para alquilar en Rosario con más información. Los análisis son
            informativos y no reemplazan el asesoramiento de un profesional.
          </p>
        </div>
      </footer>
    </div>
  )
}
