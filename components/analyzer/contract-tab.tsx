'use client'

import { useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  FileSearch,
  FileText,
  Loader2,
  Minus,
  Save,
  ScanLine,
  Scale,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { saveAnalysis } from '@/app/actions/analyses'

export type Analisis = {
  resumen: string
  fechaContratoDetectada: string
  regimenAplicable: string
  esPosteriorNuevaLey: boolean
  analisisLegal: string[]
  cumplimientoNormativo: {
    aspecto: string
    estado: 'cumple' | 'no-cumple' | 'segun-pacto' | 'no-determinado'
    detalle: string
  }[]
  indiceActualizacion: string
  frecuenciaAjuste: string
  duracion: string
  puntosClave: string[]
  clausulasRiesgosas: { titulo: string; detalle: string; severidad: 'alta' | 'media' | 'baja' }[]
  preguntasSugeridas: string[]
}

const EJEMPLO = `CONTRATO DE LOCACIÓN DE VIVIENDA. Entre el Sr. Locador y el Sr. Locatario se conviene la locación del inmueble sito en Av. Corrientes 1234, CABA. PLAZO: el presente contrato tendrá una duración de veinticuatro (24) meses a partir del 01/06/2025. PRECIO: el alquiler mensual inicial se fija en PESOS CUATROCIENTOS MIL ($400.000). ACTUALIZACIÓN: el valor se ajustará trimestralmente conforme al Índice de Contratos de Locación (ICL) publicado por el BCRA. GARANTÍA: el locatario deberá presentar garantía propietaria en CABA. DEPÓSITO: equivalente a un (1) mes de alquiler. RESCISIÓN ANTICIPADA: en caso de rescisión antes de los 6 meses, el locatario abonará dos meses de alquiler en concepto de multa. Los gastos de expensas extraordinarias estarán a cargo del locatario.`

const MAX_FILE_MB = 15

const severidadStyles: Record<string, string> = {
  alta: 'bg-destructive text-white',
  media: 'bg-accent text-accent-foreground',
  baja: 'bg-secondary text-secondary-foreground',
}

const estadoConfig: Record<string, { label: string; className: string; icon: typeof Check }> = {
  cumple: { label: 'Cumple', className: 'text-primary', icon: Check },
  'no-cumple': { label: 'No cumple', className: 'text-destructive', icon: X },
  'segun-pacto': { label: 'Según pacto', className: 'text-accent-foreground', icon: Minus },
  'no-determinado': { label: 'Sin datos', className: 'text-muted-foreground', icon: Minus },
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function ContractTab({ isAuthed = false }: { isAuthed?: boolean }) {
  const [contrato, setContrato] = useState('')
  const [fecha, setFecha] = useState('')
  const [titulo, setTitulo] = useState('')
  const [archivo, setArchivo] = useState<{ name: string; dataUrl: string; mediaType: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [analisis, setAnalisis] = useState<Analisis | null>(null)

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const scanInputRef = useRef<HTMLInputElement>(null)

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`El archivo supera los ${MAX_FILE_MB} MB.`)
      return
    }
    try {
      const dataUrl = await readAsDataURL(file)
      setArchivo({ name: file.name, dataUrl, mediaType: file.type || 'application/octet-stream' })
      setContrato('')
      toast.success('Archivo cargado. Ya podés analizarlo.')
    } catch {
      toast.error('No se pudo leer el archivo.')
    }
  }

  const puedeAnalizar = archivo !== null || contrato.trim().length >= 40

  async function analizar() {
    setLoading(true)
    setAnalisis(null)
    setSaved(false)
    try {
      const body = archivo
        ? { fileData: archivo.dataUrl, mediaType: archivo.mediaType, fechaContrato: fecha || undefined }
        : { contrato, fechaContrato: fecha || undefined }
      const res = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  async function guardar() {
    if (!analisis) return
    setSaving(true)
    try {
      const res = await saveAnalysis({
        titulo: titulo.trim() || `Contrato ${analisis.fechaContratoDetectada || 'sin fecha'}`,
        fechaContrato: fecha || null,
        resultado: analisis,
      })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setSaved(true)
      toast.success('Análisis guardado en tu historial.')
    } catch {
      toast.error('No se pudo guardar el análisis.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={onFileSelected}
        className="hidden"
      />
      <input
        ref={scanInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileSelected}
        className="hidden"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contrato</CardTitle>
          <CardDescription>Subí el PDF, escaneá con la cámara o pegá el texto.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => pdfInputRef.current?.click()} disabled={loading}>
              <Upload className="size-4" aria-hidden="true" />
              Subir PDF o imagen
            </Button>
            <Button variant="outline" onClick={() => scanInputRef.current?.click()} disabled={loading}>
              <ScanLine className="size-4" aria-hidden="true" />
              Escanear con cámara
            </Button>
          </div>

          {archivo && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate text-sm text-foreground">{archivo.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setArchivo(null)}
                disabled={loading}
                aria-label="Quitar archivo"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha-contrato">Fecha de firma del contrato (opcional)</Label>
            <Input
              id="fecha-contrato"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Ayuda a determinar con precisión qué régimen legal se aplica.
            </p>
          </div>

          {!archivo && (
            <>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">o pegá el texto</span>
                <Separator className="flex-1" />
              </div>
              <Textarea
                value={contrato}
                onChange={(e) => setContrato(e.target.value)}
                placeholder="Pegá acá el texto del contrato de alquiler..."
                className="min-h-[180px] resize-y font-mono text-sm leading-relaxed"
              />
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={analizar} disabled={loading || !puedeAnalizar}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {loading ? 'Analizando...' : 'Analizar contrato'}
            </Button>
            {!archivo && (
              <Button variant="ghost" onClick={() => setContrato(EJEMPLO)} disabled={loading}>
                Usar ejemplo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[360px]">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Resultado del análisis</CardTitle>
              <CardDescription>Orientación para entender el contrato (no es asesoramiento legal).</CardDescription>
            </div>
            {analisis &&
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

              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Scale className="size-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-foreground">Régimen aplicable</span>
                  <Badge variant={analisis.esPosteriorNuevaLey ? 'default' : 'secondary'}>
                    {analisis.esPosteriorNuevaLey ? 'Posterior a la desregulación' : 'Anterior a la desregulación'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{analisis.regimenAplicable}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fecha del contrato: {analisis.fechaContratoDetectada}
                </p>
                {analisis.analisisLegal.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {analisis.analisisLegal.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {analisis.cumplimientoNormativo.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Chequeo normativo</h3>
                  <div className="flex flex-col gap-2">
                    {analisis.cumplimientoNormativo.map((c, i) => {
                      const cfg = estadoConfig[c.estado] ?? estadoConfig['no-determinado']
                      const Icon = cfg.icon
                      return (
                        <div key={i} className="flex gap-2.5 rounded-lg border border-border p-3">
                          <Icon className={`mt-0.5 size-4 shrink-0 ${cfg.className}`} aria-hidden="true" />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{c.aspecto}</span>
                              <span className={`text-xs ${cfg.className}`}>{cfg.label}</span>
                            </div>
                            <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{c.detalle}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <Dato label="Ajuste" value={analisis.indiceActualizacion} />
                <Dato label="Frecuencia" value={analisis.frecuenciaAjuste} />
                <Dato label="Duración" value={analisis.duracion} />
              </div>

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
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Preguntá antes de firmar</h3>
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

              {isAuthed && !saved && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="titulo-analisis">Título para guardar (opcional)</Label>
                  <Input
                    id="titulo-analisis"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Depto Corrientes 1234"
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
