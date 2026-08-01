import { Info } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { AccountRequired } from '@/components/account-required'
import { ConditionsTab } from '@/components/analyzer/conditions-tab'
import { getSessionUser } from '@/lib/session'

export const metadata = {
  title: 'Evaluar condiciones — RentIA',
  description: 'Contanos qué te piden para alquilar y evaluá si las condiciones son razonables.',
}

export default async function CondicionesPage() {
  const user = await getSessionUser()

  return (
    <PageShell active="condiciones">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            Evaluá las condiciones
          </h1>
          <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
            Contanos qué te piden para alquilar y evaluá si las condiciones son razonables antes de
            avanzar. Es la etapa previa a firmar un contrato.
          </p>
        </div>

        {user ? (
          <ConditionsTab />
        ) : (
          <AccountRequired
            titulo="Creá una cuenta para evaluar las condiciones"
            descripcion="El análisis con IA está disponible para usuarios registrados. Crear una cuenta es gratis y además te deja guardar tus evaluaciones."
            redirect="/condiciones"
          />
        )}

        <div className="mt-8 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          Este análisis es informativo y no reemplaza el asesoramiento de un profesional.
        </div>
      </div>
    </PageShell>
  )
}
