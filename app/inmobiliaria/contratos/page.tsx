import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { desc } from 'drizzle-orm'
import { FileSearch2 } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getSubscriptionStatus } from '@/lib/subscription'
import { db } from '@/lib/db'
import { scannedContracts } from '@/lib/db/schema'
import { PageShell } from '@/components/page-shell'
import { ContractsExplorer } from '@/components/inmobiliaria/contracts-explorer'

export default async function ContratosPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-up/inmobiliaria')

  const { isInmobiliaria } = await getSubscriptionStatus()
  if (!isInmobiliaria) redirect('/inmobiliaria/upgrade')

  const contratos = await db
    .select({
      id: scannedContracts.id,
      barrio: scannedContracts.barrio,
      zona: scannedContracts.zona,
      ambientes: scannedContracts.ambientes,
      m2: scannedContracts.m2,
      alquiler: scannedContracts.alquiler,
      ajuste: scannedContracts.ajuste,
      plazo: scannedContracts.plazo,
      regimen: scannedContracts.regimen,
      fechaContrato: scannedContracts.fechaContrato,
      resumen: scannedContracts.resumen,
      createdAt: scannedContracts.createdAt,
    })
    .from(scannedContracts)
    .orderBy(desc(scannedContracts.createdAt))

  return (
    <PageShell>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSearch2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Base de contratos scaneados
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Contratos analizados por inquilinos en Rosario. Los datos están anonimizados.
              </p>
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ContractsExplorer contratos={contratos} />
      </div>
    </PageShell>
  )
}
