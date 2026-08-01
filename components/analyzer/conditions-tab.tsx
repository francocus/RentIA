'use client'

import { useState } from 'react'
import useSWR from 'swr'
import {
  CheckCircle2,
  HelpCircle,
  ListChecks,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  ThumbsUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveAnalysis } from '@/app/actions/analyses'
import type { ZonaStats } from '@/app/api/zonas/route'

export type EvaluacionCondiciones = {
  conclusion: 'conveniente' | 'para-revisar' | 'poco-conveniente'
  resumen: string
  queTePiden: string[]
  condicionesHabituales: string[]
  aNegociar: string[]
  comparacionZona: string
}

const EJEMPLO =
  'Por ejemplo: dos meses de depósito, garantía propietaria, aumento cada tres meses y contrato por dos años.'

const conclusionConfig: Record<
  EvaluacionCondiciones['conclusion'],
  { label: string; className: string }
> = {
  conveniente: { label: 'Conveniente', className: 'bg-primary text-primary-foreground' },
  'para-revisar': { label: 'Para revisar', className: 'bg-accent text-accent-foreground' },
  'poco-conveniente': { label: 'Poco conveniente', className: 'bg-destructive text-white' },
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const AMBIENTES = ['1', '2', '3', '4']

export function ConditionsTab() {
  const { data } = useSWR<{ zonas: ZonaStats[] }>('/api/zonas', fetcher, {
    revalidateOnFocus: false,
  })
  const zonas = data?.zonas ?? []

  const [condiciones, setCondiciones] = useState('')
  const [zonaId, setZonaId] = useState<string>('')
  const [ambientes, setAmbientes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [evaluacion, setEvaluacion] = useState<EvaluacionCondiciones | null>(null)

  const puedeEvaluar = condiciones.trim().length >= 15

  async function evaluar() {
    setLoading(true)
    setEvaluacion(null)
    setSaved(false)
    try {
      const res = await fetch('/api/analyze-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condiciones,
          zonaId: zonaId || undefined,
          ambientes: ambientes || undefined,
        }),
      })
      const dataRes = await res.json()
      if (!res.ok) {
        if (res.status === 401) window.location.href = '/sign-in?next=/condiciones'
        toast.error(dataRes.error ?? 'No se pudo evaluar las condiciones.')
        return
      }
      setEvaluacion(dataRes as EvaluacionCondiciones)
    } catch {
      toast.error('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function guardar() {
    if (!evaluacion) return
    setSaving(true)
    try {
      const zonaNombre = zonas.find((z) => z.zonaId === zonaId)?.nombre
      const res = await saveAnalysis({
        titulo: `Condiciones ${zonaNombre ? `· ${zonaNombre}` : ''}`.trim(),
        fechaContrato: null,
        resultado: {
          ...evaluacion,
          regimenAplicable: 'Evaluación de condiciones (antes de firmar)',
        },
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setSaved(true)
      toast.success('Evaluación guardada en tu historial.')
    } catch {
      toast.error('No se pudo guardar la evaluación.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Qué te piden para alquilar?</CardTitle>
          <CardDescription>
            Escribí las condiciones que te pasó el propietario o la inmobiliaria.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="condiciones">Condiciones</Label>
            <Textarea
              id="condiciones"
              value={condiciones}
              onChange={(e) => setCondiciones(e.target.value)}
              placeholder={EJEMPLO}
              className="min-h-[160px] resize-y text-sm leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="zona-cond">Zona (opcional)</Label>
              <Select value={zonaId} onValueChange={(v) => setZonaId(v ?? '')}>
                <SelectTrigger id="zona-cond">
                  <SelectValue placeholder="Elegí una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zonas.map((z) => (
                    <SelectItem key={z.zonaId} value={z.zonaId}>
                      {z.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amb-cond">Ambientes (opcional)</Label>
              <Select value={ambientes} onValueChange={(v) => setAmbientes(v ?? '')}>
                <SelectTrigger id="amb-cond">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {AMBIENTES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a === '4' ? '4 o más' : a} ambiente{a === '1' ? '' : 's'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Elegir la zona y los ambientes nos ayuda a comparar con otros alquileres reales del barrio.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={evaluar} disabled={loading || !puedeEvaluar}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {loading ? 'Evaluando...' : 'Evaluar condiciones'}
            </Button>
            <Button variant="ghost" onClick={() => setCondiciones(EJEMPLO)} disabled={loading}>
              Usar ejemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[360px]">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Resultado</CardTitle>
              <CardDescription>Orientación antes de firmar (no es asesoramiento legal).</CardDescription>
            </div>
            {evaluacion && (
              <Button size="sm" variant="outline" onClick={guardar} disabled={saving || saved}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                {saved ? 'Guardado' : 'Guardar'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!evaluacion && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
              <ListChecks className="size-10 opacity-40" aria-hidden="true" />
              <p className="max-w-xs text-sm leading-relaxed">
                Escribí las condiciones y la evaluación va a aparecer acá.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" aria-hidden="true" />
              <p className="text-sm">Evaluando las condiciones...</p>
            </div>
          )}

          {evaluacion && (
            <div className="flex flex-col gap-5">
              <div>
                <Badge className={conclusionConfig[evaluacion.conclusion].className}>
                  {conclusionConfig[evaluacion.conclusion].label}
                </Badge>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{evaluacion.resumen}</p>
              </div>

              {evaluacion.queTePiden.length > 0 && (
                <ListaSeccion
                  icon={ListChecks}
                  titulo="Qué te están pidiendo"
                  items={evaluacion.queTePiden}
                  dot="bg-primary"
                />
              )}

              {evaluacion.condicionesHabituales.length > 0 && (
                <ListaSeccion
                  icon={ThumbsUp}
                  titulo="Qué es habitual"
                  items={evaluacion.condicionesHabituales}
                  dot="bg-primary"
                />
              )}

              {evaluacion.aNegociar.length > 0 && (
                <ListaSeccion
                  icon={HelpCircle}
                  titulo="Para consultar o negociar"
                  items={evaluacion.aNegociar}
                  dot="bg-accent"
                />
              )}

              <Separator />

              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MapPin className="size-4 text-primary" aria-hidden="true" />
                  Comparación con la zona
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{evaluacion.comparacionZona}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ListaSeccion({
  icon: Icon,
  titulo,
  items,
  dot,
}: {
  icon: typeof CheckCircle2
  titulo: string
  items: string[]
  dot: string
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-primary" aria-hidden="true" />
        {titulo}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${dot}`} />
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}
