'use client'

import { useState } from 'react'
import { AlertTriangle, FileSearch, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type Analisis = {
  resumen: string
  indiceActualizacion: string
  frecuenciaAjuste: string
  duracion: string
  puntosClave: string[]
  clausulasRiesgosas: { titulo: string; detalle: string; severidad: 'alta' | 'media' | 'baja' }[]
  preguntasSugeridas: string[]
}

const EJEMPLO = `CONTRATO DE LOCACIÓN DE VIVIENDA. Entre el Sr. Locador y el Sr. Locatario se conviene la locación del inmueble sito en Av. Corrientes 1234, CABA. PLAZO: el presente contrato tendrá una duración de veinticuatro (24) meses a partir del 01/06/2025. PRECIO: el alquiler mensual inicial se fija en PESOS CUATROCIENTOS MIL ($400.000). ACTUALIZACIÓN: el valor se ajustará trimestralmente conforme al Índice de Contratos de Locación (ICL) publicado por el BCRA. GARANTÍA: el locatario deberá presentar garantía propietaria en CABA. DEPÓSITO: equivalente a un (1) mes de alquiler. RESCISIÓN ANTICIPADA: en caso de rescisión antes de los 6 meses, el locatario abonará dos meses de alquiler en concepto de multa. Los gastos de expensas extraordinarias estarán a cargo del locatario.`

const severidadStyles: Record<string, string> = {
  alta: 'bg-destructive text-white',
  media: 'bg-accent text-accent-foreground',
  baja: 'bg-secondary text-secondary-foreground',
}

export function ContractAnalyzer() {
  const [contrato, setContrato] = useState('')
  const [loading, setLoading] = useState(false)
  const [analisis, setAnalisis] = useState<Analisis | null>(null)

  async function analizar() {
    setLoading(true)
    setAnalisis(null)
    try {
      const res = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contrato }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo analizar el contrato.')
        return
      }
      setAnalisis(data as Analisis)
    } catch {
      toast.error('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contrato" className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Analizá tu contrato con IA</h2>
        <p className="mt-1 text-muted-foreground">
          Pegá el texto del contrato y la IA te explica ajustes, plazos y cláusulas riesgosas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Texto del contrato</CardTitle>
            <CardDescription>Pegá las cláusulas o el contrato completo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              value={contrato}
              onChange={(e) => setContrato(e.target.value)}
              placeholder="Pegá acá el texto del contrato de alquiler..."
              className="min-h-[260px] resize-y font-mono text-sm leading-relaxed"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={analizar} disabled={loading || contrato.trim().length < 40}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {loading ? 'Analizando...' : 'Analizar contrato'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setContrato(EJEMPLO)}
                disabled={loading}
              >
                Usar ejemplo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[360px]">
          <CardHeader>
            <CardTitle className="text-base">Resultado del análisis</CardTitle>
            <CardDescription>Orientación para entender el contrato (no es asesoramiento legal).</CardDescription>
          </CardHeader>
          <CardContent>
            {!analisis && !loading && (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                <FileSearch className="size-10 opacity-40" aria-hidden="true" />
                <p className="max-w-xs text-sm leading-relaxed">
                  El análisis va a aparecer acá una vez que proceses un contrato.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" aria-hidden="true" />
                <p className="text-sm">Leyendo y analizando el contrato...</p>
              </div>
            )}

            {analisis && (
              <div className="flex flex-col gap-5">
                <p className="text-sm leading-relaxed text-foreground">{analisis.resumen}</p>

                <div className="grid grid-cols-2 gap-3">
                  <Dato label="Ajuste" value={analisis.indiceActualizacion} />
                  <Dato label="Frecuencia" value={analisis.frecuenciaAjuste} />
                  <Dato label="Duración" value={analisis.duracion} />
                </div>

                <Separator />

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Puntos clave</h3>
                  <ul className="flex flex-col gap-1.5">
                    {analisis.puntosClave.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                {analisis.clausulasRiesgosas.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
                      Cláusulas a revisar
                    </h3>
                    <div className="flex flex-col gap-2">
                      {analisis.clausulasRiesgosas.map((c, i) => (
                        <div key={i} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-foreground">{c.titulo}</span>
                            <Badge className={severidadStyles[c.severidad] ?? ''}>{c.severidad}</Badge>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.detalle}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analisis.preguntasSugeridas.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-foreground">
                      Preguntá antes de firmar
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                      {analisis.preguntasSugeridas.map((q, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                          <span className="text-primary">?</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
