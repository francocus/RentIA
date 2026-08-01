import { Info } from 'lucide-react'
import { PageShell } from '@/components/page-shell'
import { AccountRequired } from '@/components/account-required'
import { ContractTab } from '@/components/analyzer/contract-tab'
import { getSessionUser } from '@/lib/session'
import { ULTIMA_ACTUALIZACION_NORMATIVA } from '@/lib/ley-alquileres'

export const metadata = {
  title: 'Revisar contrato — RentIA',
  description: 'Subí tu contrato de alquiler en PDF o imagen y entendé en palabras simples qué revisar.',
}

export default async function ContratoPage() {
  const user = await getSessionUser()

  return (
    <PageShell active="contrato">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            Revisá tu contrato
          </h1>
          <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
            Subí el contrato en PDF o como imagen. Te explicamos en palabras simples qué puntos
            revisar, qué condiciones podrían perjudicarte y si hubo cambios recientes en la
            normativa.
          </p>
        </div>

        {user ? (
          <ContractTab isAuthed />
        ) : (
          <AccountRequired
            titulo="Creá una cuenta para revisar tu contrato"
            descripcion="El análisis con IA está disponible para usuarios registrados. Crear una cuenta es gratis y además te deja guardar tus análisis."
            redirect="/contrato"
          />
        )}

        <div className="mt-8 flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            Este análisis es informativo y no reemplaza el asesoramiento de un profesional.
          </p>
          <p className="pl-6">
            Última actualización de las leyes de alquiler: {ULTIMA_ACTUALIZACION_NORMATIVA}.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
