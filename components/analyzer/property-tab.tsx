'use client'

import { useState } from 'react'
import { Building2, CheckCircle2, HelpCircle, Loader2, Save, Sparkles, TriangleAlert, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

export type Evaluacion = {
  veredicto: 'caro' | 'justo' | 'barato' | 'sin-referencia'
  resumen: string
  rangoEstimadoZona: string
  analisisPrecio: string[]
  costoMensualEstimado: { concepto: string; monto: string }[]
  puntosAFavor: string[]
  puntosDeAtencion: string[]
  checklistVisita: string[]
  preguntasSugeridas: string[]
  recomendacionFinal: string
}

type Form = {
  tipo: string
  ambientes: string
  superficie: string
  barrio: string
  ciudad: string
  valorPedido: string
  expensas: string
  antiguedad: string
  amoblado: boolean
  caracteristicas: string
}

const initialForm: Form = {
  tipo: 'departamento',
  ambientes: '2',
  superficie: '',
  barrio: '',
  ciudad: 'CABA',
  valorPedido: '',
  expensas: '',
  antiguedad: '',
  amoblado: false,
  caracteristicas: '',
}

const veredictoConfig: Record<Evaluacion['veredicto'], { label: string; className: string }> = {
  caro: { label: 'Precio por encima del mercado', className: 'bg-destructive text-white' },
  justo: { label: 'Precio en línea con el mercado', className: 'bg-primary text-primary-foreground' },
  barato: { label: 'Precio por debajo del mercado', className: 'bg-primary text-primary-foreground' },
  'sin-referencia': { label: 'Sin referencia suficiente', className: 'bg-secondary text-secondary-foreground' },
}

export function PropertyTab({ isAuthed = false }: { isAuthed?: boolean }) {
  const [form, setForm] = useState<Form>(initialForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null)

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function evaluar() {
    if (!form.valorPedido || Number(form.valorPedido) <= 0) {
      toast.error('Ingresá el valor de alquiler pedido.')
      return
    }
    setLoading(true)
    setEvaluacion(null)
    setSaved(false)
    try {
      const res = await fetch('/api/analyze-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inmueble: form }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo evaluar el inmueble.')
        return
      }
      setEvaluacion(data as Evaluacion)
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
      const titulo = `Inmueble ${form.ambientes} amb. ${form.barrio || form.ciudad || ''}`.trim()
      const res = await saveAnalysis({
        titulo,
        fechaContrato: null,
        resultado: {
          ...evaluacion,
          regimenAplicable: 'Evaluación de inmueble (sin contrato)',
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
          <CardTitle className="text-base">Datos del inmueble</CardTitle>
          <CardDescription>Contanos qué querés alquilar y la IA evalúa si conviene.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set('tipo', v ?? 'departamento')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="ph">PH</SelectItem>
                  <SelectItem value="monoambiente">Monoambiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ambientes">Ambientes</Label>
              <Input
                id="ambientes"
                type="number"
                min="1"
                value={form.ambientes}
                onChange={(e) => set('ambientes', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="superficie">Superficie (m²)</Label>
              <Input
                id="superficie"
                type="number"
                min="1"
                value={form.superficie}
                onChange={(e) => set('superficie', e.target.value)}
                placeholder="Ej: 45"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="antiguedad">Antigüedad</Label>
              <Input
                id="antiguedad"
                value={form.antiguedad}
                onChange={(e) => set('antiguedad', e.target.value)}
                placeholder="Ej: a estrenar, 10 años"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="barrio">Barrio / Zona</Label>
              <Input
                id="barrio"
                value={form.barrio}
                onChange={(e) => set('barrio', e.target.value)}
                placeholder="Ej: Palermo"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input id="ciudad" value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="valor">Alquiler pedido ($/mes)</Label>
              <Input
                id="valor"
                type="number"
                min="0"
                value={form.valorPedido}
                onChange={(e) => set('valorPedido', e.target.value)}
                placeholder="Ej: 550000"
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="expensas">Expensas ($/mes)</Label>
              <Input
                id="expensas"
                type="number"
                min="0"
                value={form.expensas}
                onChange={(e) => set('expensas', e.target.value)}
                placeholder="Opcional"
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="caracteristicas">Características</Label>
            <Textarea
              id="caracteristicas"
              value={form.caracteristicas}
              onChange={(e) => set('caracteristicas', e.target.value)}
              placeholder="Balcón, cochera, luminoso, apto profesional, etc."
              className="min-h-[72px] resize-y text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.amoblado}
              onChange={(e) => set('amoblado', e.target.checked)}
              className="size-4 accent-primary"
            />
            Amoblado
          </label>

          <Button onClick={evaluar} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {loading ? 'Evaluando...' : 'Evaluar inmueble'}
          </Button>
        </CardContent>
      </Card>

      <Card className="min-h-[360px]">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Evaluación</CardTitle>
              <CardDescription>Orientación sobre precio y conveniencia (no es tasación oficial).</CardDescription>
            </div>
            {evaluacion &&
              (isAuthed ? (
                <Button size="sm" variant="outline" onClick={guardar} disabled={saving || saved}>
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  {saved ? 'Guardado' : 'Guardar'}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => (window.location.href = '/sign-in')}>
                  Iniciá sesión para guardar
                </Button>
              ))}
          </div>
        </CardHeader>
        <CardContent>
          {!evaluacion && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
              <Building2 className="size-10 opacity-40" aria-hidden="true" />
              <p className="max-w-xs text-sm leading-relaxed">
                Completá los datos del inmueble y la evaluación va a aparecer acá.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" aria-hidden="true" />
              <p className="text-sm">Evaluando el inmueble...</p>
            </div>
          )}

          {evaluacion && (
            <div className="flex flex-col gap-5">
              <div>
                <Badge className={veredictoConfig[evaluacion.veredicto].className}>
                  {veredictoConfig[evaluacion.veredicto].label}
                </Badge>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{evaluacion.resumen}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Rango estimado en la zona: <span className="font-medium text-foreground">{evaluacion.rangoEstimadoZona}</span>
                </p>
              </div>

              {evaluacion.analisisPrecio.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Análisis del precio</h3>
                  <ul className="flex flex-col gap-1.5">
                    {evaluacion.analisisPrecio.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluacion.costoMensualEstimado.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Wallet className="size-4 text-primary" aria-hidden="true" />
                    Costo mensual estimado
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {evaluacion.costoMensualEstimado.map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">{c.concepto}</span>
                        <span className="font-medium text-foreground">{c.monto}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                {evaluacion.puntosAFavor.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                      A favor
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                      {evaluacion.puntosAFavor.map((p, i) => (
                        <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {evaluacion.puntosDeAtencion.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <TriangleAlert className="size-4 text-destructive" aria-hidden="true" />
                      A revisar
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                      {evaluacion.puntosDeAtencion.map((p, i) => (
                        <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {evaluacion.checklistVisita.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Checklist para la visita</h3>
                  <ul className="flex flex-col gap-1.5">
                    {evaluacion.checklistVisita.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluacion.preguntasSugeridas.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <HelpCircle className="size-4 text-primary" aria-hidden="true" />
                    Preguntá antes de avanzar
                  </h3>
                  <ul className="flex flex-col gap-1.5">
                    {evaluacion.preguntasSugeridas.map((q, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="text-primary">?</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium text-foreground">Recomendación</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{evaluacion.recomendacionFinal}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
