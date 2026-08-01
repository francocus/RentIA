import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { ApplicantAnalyzer } from '@/components/inmobiliaria/applicant-analyzer'
import { getSubscriptionStatus } from '@/lib/subscription'

export default async function PostulantePage() {
  const { isInmobiliaria } = await getSubscriptionStatus()
  if (!isInmobiliaria) redirect('/inmobiliaria/upgrade')

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <Link
            href="/inmobiliaria"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver a Inmobiliaria
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Analizar postulante
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Completá los datos del postulante y la documentación recibida. La IA revisará el
            expediente y generará un informe de situación.
          </p>
        </div>
        <ApplicantAnalyzer />
      </div>
    </PageShell>
  )
}
