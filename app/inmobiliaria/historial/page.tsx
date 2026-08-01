import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { getSubscriptionStatus } from '@/lib/subscription'
import { getApplicantAnalyses } from '@/app/actions/applicant-analyses'
import { ApplicantHistoryList } from '@/components/inmobiliaria/applicant-history-list'
import { buttonVariants } from '@/components/ui/button'

export default async function HistorialPage() {
  const { isInmobiliaria } = await getSubscriptionStatus()
  if (!isInmobiliaria) redirect('/inmobiliaria/upgrade')

  const analyses = await getApplicantAnalyses()

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/inmobiliaria"
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver a Inmobiliaria
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Historial de análisis
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Todos los postulantes analizados con IA. Los análisis se guardan automáticamente.
            </p>
          </div>
          <Link href="/inmobiliaria/postulante" className={buttonVariants({ size: 'sm' })}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo análisis
          </Link>
        </div>

        <ApplicantHistoryList initialAnalyses={analyses} />
      </div>
    </PageShell>
  )
}
