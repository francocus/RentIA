import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getAnalyses } from '@/app/actions/analyses'
import { SiteHeader } from '@/components/site-header'
import { AnalysisHistory } from '@/components/analysis-history'

export const metadata = {
  title: 'Mis análisis — RentIA',
}

export default async function HistorialPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const registros = await getAnalyses()

  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader user={session.user} />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis análisis</h1>
          <p className="mt-1 text-muted-foreground">
            Todos los contratos que analizaste y guardaste con RentIA.
          </p>
        </div>
        <AnalysisHistory registros={registros} />
      </div>
    </main>
  )
}
