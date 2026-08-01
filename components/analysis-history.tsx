'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronDown, ChevronUp, FileText, Scale, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteAnalysis } from '@/app/actions/analyses'

type Registro = {
  id: number
  titulo: string
  fechaContrato: string | null
  regimen: string | null
  esPosteriorNuevaLey: boolean | null
  resumen: string | null
  resultado: unknown
  createdAt: Date | string
}

export function AnalysisHistory({ registros }: { registros: Registro[] }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState<number | null>(null)
  const [borrando, setBorrando] = useState<number | null>(null)

  async function borrar(id: number) {
    setBorrando(id)
    try {
      await deleteAnalysis(id)
      toast.success('Análisis eliminado.')
      router.refresh()
    } catch {
      toast.error('No se pudo eliminar.')
    } finally {
      setBorrando(null)
    }
  }

  if (registros.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <FileText className="size-10 opacity-40" aria-hidden="true" />
          <p className="max-w-sm text-sm leading-relaxed">
            Todavía no guardaste ningún análisis. Analizá un contrato desde el inicio y tocá
            &quot;Guardar&quot; para verlo acá.
          </p>
          <Button onClick={() => router.push('/#contrato')}>Analizar un contrato</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {registros.map((r) => {
        const res = (r.resultado ?? {}) as {
          puntosClave?: string[]
          clausulasRiesgosas?: { titulo: string; detalle: string; severidad: string }[]
          analisisLegal?: string[]
        }
        const isOpen = abierto === r.id
        return (
          <Card key={r.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base">{r.titulo}</CardTitle>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Guardado el{' '}
                      {new Date(r.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {r.fechaContrato && <span>· Firma: {r.fechaContrato}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => borrar(r.id)}
                  disabled={borrando === r.id}
                  aria-label="Eliminar análisis"
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {r.regimen && (
                  <Badge variant="secondary" className="gap-1">
                    <Scale className="size-3" aria-hidden="true" />
                    {r.regimen}
                  </Badge>
                )}
                {r.esPosteriorNuevaLey !== null && (
                  <Badge variant={r.esPosteriorNuevaLey ? 'default' : 'outline'}>
                    {r.esPosteriorNuevaLey ? 'Posterior a la desregulación' : 'Anterior a la desregulación'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {r.resumen && <p className="text-sm leading-relaxed text-foreground">{r.resumen}</p>}

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 text-primary hover:bg-transparent"
                onClick={() => setAbierto(isOpen ? null : r.id)}
              >
                {isOpen ? (
                  <>
                    Ocultar detalle <ChevronUp className="size-4" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Ver detalle <ChevronDown className="size-4" aria-hidden="true" />
                  </>
                )}
              </Button>

              {isOpen && (
                <div className="mt-3 flex flex-col gap-4 border-t border-border pt-4">
                  {res.analisisLegal && res.analisisLegal.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Análisis legal</h3>
                      <ul className="flex flex-col gap-1.5">
                        {res.analisisLegal.map((p, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {res.puntosClave && res.puntosClave.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-foreground">Puntos clave</h3>
                      <ul className="flex flex-col gap-1.5">
                        {res.puntosClave.map((p, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {res.clausulasRiesgosas && res.clausulasRiesgosas.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
                        Cláusulas a revisar
                      </h3>
                      <div className="flex flex-col gap-2">
                        {res.clausulasRiesgosas.map((c, i) => (
                          <div key={i} className="rounded-lg border border-border p-3">
                            <span className="text-sm font-medium text-foreground">{c.titulo}</span>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.detalle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
