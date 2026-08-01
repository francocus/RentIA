'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  History,
  Scale,
  Sparkles,
  TriangleAlert,
  Upload,
  User,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import type { AnalisisPostulante } from '@/app/api/analyze-applicant/route'

const TIPOS_EMPLEO = [
  'Relación de dependencia',
  'Monotributo',
  'Autónomo',
  'Empleado público',
  'Independiente / Freelance',
  'Jubilado / Pensionado',
  'Sin actividad declarada',
]

const DOCS_OPCIONES = [
  'DNI (frente y dorso)',
  'Recibos de sueldo (últimos 3 meses)',
  'Garantía propietaria (escritura)',
  'CUIL / CUIT',
  'Constancia de empleo',
  'Seguro de caución',
  'Otros documentos',
]

const estadoConfig: Record<
  AnalisisPostulante['estado'],
  { label: string; variant: 'default' | 'secondary' | 'destructive'; dot: string }
> = {
  aprobado: { label: 'Apto para avanzar', variant: 'default', dot: 'bg-primary' },
  revisar: { label: 'Requiere revisión', variant: 'secondary', dot: 'bg-yellow-500' },
  rechazado: { label: 'Documentación insuficiente', variant: 'destructive', dot: 'bg-destructive' },
}

type Step = 'form' | 'loading' | 'result'

function downloadInforme(resultado: AnalisisPostulante, postulante: { nombre: string; dni: string; tipoEmpleo: string; ingresos: string }) {
  const lines = [
    '=== INFORME DE POSTULANTE — RentIA ===',
    `Fecha: ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    '',
    '--- DATOS DEL POSTULANTE ---',
    `Nombre: ${postulante.nombre}`,
    `DNI: ${postulante.dni}`,
    `Tipo de empleo: ${postulante.tipoEmpleo || 'No informado'}`,
    `Ingresos declarados: ${postulante.ingresos ? `$${Number(postulante.ingresos).toLocaleString('es-AR')}` : 'No informado'}`,
    '',
    '--- RESULTADO DEL ANÁLISIS ---',
    `Estado: ${estadoConfig[resultado.estado].label.toUpperCase()}`,
    '',
    `Resumen: ${resultado.resumen}`,
    '',
    '--- DOCUMENTACIÓN ---',
    ...resultado.documentosRecibidos.map(
      (d) => `${d.estado === 'recibido' ? '[OK]' : '[FALTANTE]'} ${d.nombre}${d.observacion ? ' — ' + d.observacion : ''}`,
    ),
    '',
    '--- INFORMACIÓN ECONÓMICA ---',
    `Ingreso detectado: ${resultado.ingresoDetectado || 'No informado'}`,
    `Antigüedad laboral: ${resultado.antiguedadLaboral || 'No informada'}`,
    `Relación ingresos/alquiler: ${resultado.relacionIngresosAlquiler || 'No evaluada'}`,
    '',
  ]

  if (resultado.riesgos?.length > 0) {
    lines.push('--- RIESGOS IDENTIFICADOS ---')
    resultado.riesgos.forEach((r) => lines.push(`• ${r}`))
    lines.push('')
  }

  if (resultado.puntosPositivos?.length > 0) {
    lines.push('--- PUNTOS POSITIVOS ---')
    resultado.puntosPositivos.forEach((p) => lines.push(`• ${p}`))
    lines.push('')
  }

  lines.push('--- OBSERVACIONES IA ---', resultado.observaciones, '')
  lines.push('--- RECOMENDACIÓN ---', resultado.recomendacion, '')

  if (resultado.verificacionLegal) {
    const v = resultado.verificacionLegal
    lines.push(
      '--- VERIFICACIÓN LEGAL (InfoLEG) ---',
      `Régimen aplicable: ${v.regimen}`,
      `Plazo mínimo: ${v.plazosMinimos}`,
      `Depósito máximo: ${v.deposito}`,
      `Índice de ajuste: ${v.indiceAjuste}`,
      `Observaciones: ${v.observacionesLegales}`,
      '',
    )
  }

  lines.push('=== Generado por RentIA — rentia.com.ar ===')

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `informe-${postulante.nombre.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function ApplicantAnalyzer() {
  const [step, setStep] = useState<Step>('form')
  const [resultado, setResultado] = useState<AnalisisPostulante | null>(null)
  const [showLegal, setShowLegal] = useState(false)

  // Form state
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [ingresos, setIngresos] = useState('')
  const [alquilerEstimado, setAlquilerEstimado] = useState('')
  const [tipoEmpleo, setTipoEmpleo] = useState('')
  const [antiguedad, setAntiguedad] = useState('')
  const [docsSeleccionados, setDocsSeleccionados] = useState<string[]>([])
  const topRef = useRef<HTMLDivElement>(null)

  const toggleDoc = (doc: string) => {
    setDocsSeleccionados((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc],
    )
  }

  const puedeAnalizar = nombre.trim().length > 0 && dni.trim().length > 0

  async function analizar() {
    setStep('loading')
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
    try {
      const res = await fetch('/api/analyze-applicant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postulante: { nombre, dni, email, telefono, ingresos, tipoEmpleo, antiguedad },
          documentos: docsSeleccionados,
          alquilerEstimado,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo analizar el postulante.')
        setStep('form')
        return
      }
      setResultado(data as AnalisisPostulante)
      setStep('result')
      toast.success('Análisis guardado en el historial')
    } catch {
      toast.error('Error de conexión. Intentá de nuevo.')
      setStep('form')
    }
  }

  function reiniciar() {
    setStep('form')
    setResultado(null)
    setNombre('')
    setDni('')
    setEmail('')
    setTelefono('')
    setIngresos('')
    setAlquilerEstimado('')
    setTipoEmpleo('')
    setAntiguedad('')
    setDocsSeleccionados([])
    setShowLegal(false)
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div ref={topRef} className="flex flex-col gap-6">

      {/* Step: loading */}
      {step === 'loading' && (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-8 animate-pulse text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Analizando el postulante...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              La IA revisa la documentación, evalúa la solvencia y verifica el marco legal vigente.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 animate-spin" aria-hidden="true" />
            Esto toma unos segundos...
          </div>
        </div>
      )}

      {/* Step: form */}
      {step === 'form' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Datos personales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" aria-hidden="true" />
                Datos del postulante
              </CardTitle>
              <CardDescription>
                Completá los datos que te proporcionó el interesado.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label htmlFor="nombre">Nombre y apellido *</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan García"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dni">DNI *</Label>
                  <Input
                    id="dni"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="30.123.456"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="341 555-1234"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@email.com"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Briefcase className="size-4 text-primary" aria-hidden="true" />
                  Situación laboral y económica
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="tipo-empleo">Tipo de empleo</Label>
                    <Select value={tipoEmpleo} onValueChange={(v) => setTipoEmpleo(v ?? '')}>
                      <SelectTrigger id="tipo-empleo">
                        <SelectValue placeholder="Seleccioná" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_EMPLEO.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ingresos">Ingresos mensuales ($)</Label>
                    <Input
                      id="ingresos"
                      type="number"
                      value={ingresos}
                      onChange={(e) => setIngresos(e.target.value)}
                      placeholder="1.500.000"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="antiguedad">Antigüedad laboral</Label>
                    <Input
                      id="antiguedad"
                      value={antiguedad}
                      onChange={(e) => setAntiguedad(e.target.value)}
                      placeholder="2 años"
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="alquiler-estimado">Alquiler estimado de la propiedad ($)</Label>
                    <Input
                      id="alquiler-estimado"
                      type="number"
                      value={alquilerEstimado}
                      onChange={(e) => setAlquilerEstimado(e.target.value)}
                      placeholder="500.000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Opcional. Permite evaluar la relación ingresos/alquiler (mínimo recomendado: 3x).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentación */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="size-4 text-primary" aria-hidden="true" />
                  Documentación recibida
                </CardTitle>
                <CardDescription>
                  Marcá los documentos que el postulante ya entregó.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {DOCS_OPCIONES.map((doc) => {
                  const activo = docsSeleccionados.includes(doc)
                  return (
                    <button
                      key={doc}
                      type="button"
                      onClick={() => toggleDoc(doc)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                        activo
                          ? 'border-primary/50 bg-primary/5 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/40'
                      }`}
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                          activo ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                        }`}
                      >
                        {activo && <CheckCircle2 className="size-3.5" aria-hidden="true" />}
                      </span>
                      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      {doc}
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            <Button size="lg" className="w-full" onClick={analizar} disabled={!puedeAnalizar}>
              <Sparkles className="size-5" aria-hidden="true" />
              Analizar con IA
            </Button>
            {!puedeAnalizar && (
              <p className="text-center text-xs text-muted-foreground">
                Completá al menos nombre y DNI para continuar.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step: result */}
      {step === 'result' && resultado && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={reiniciar}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Nuevo análisis
            </button>
            <div className="flex items-center gap-2">
              <Link
                href="/inmobiliaria/historial"
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <History className="size-4" aria-hidden="true" />
                Ver historial
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadInforme(resultado, { nombre, dni, tipoEmpleo, ingresos })}
              >
                <Download className="size-4" aria-hidden="true" />
                Descargar informe
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Resultado del análisis</CardTitle>
                  <CardDescription className="mt-1">{nombre} &middot; DNI {dni}</CardDescription>
                </div>
                <Badge variant={estadoConfig[resultado.estado].variant} className="shrink-0">
                  {estadoConfig[resultado.estado].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <p className="text-sm leading-relaxed text-foreground">{resultado.resumen}</p>

              <Separator />

              {/* Relación ingresos/alquiler */}
              {resultado.relacionIngresosAlquiler && (
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
                  <Briefcase className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Relación ingresos / alquiler</p>
                    <p className="mt-0.5 text-sm text-foreground">{resultado.relacionIngresosAlquiler}</p>
                  </div>
                </div>
              )}

              {/* Documentos */}
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <FileText className="size-4 text-primary" aria-hidden="true" />
                  Documentos
                </h3>
                <div className="flex flex-col gap-2">
                  {resultado.documentosRecibidos.map((doc, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {doc.estado === 'recibido'
                        ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        : <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                      }
                      <div>
                        <span className={doc.estado === 'recibido' ? 'text-foreground' : 'text-muted-foreground line-through'}>
                          {doc.nombre}
                        </span>
                        {doc.estado === 'faltante' && (
                          <span className="ml-1 text-xs text-destructive">(faltante)</span>
                        )}
                        {doc.observacion && (
                          <p className="text-xs text-muted-foreground">{doc.observacion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Riesgos y puntos positivos */}
              {(resultado.riesgos?.length > 0 || resultado.puntosPositivos?.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {resultado.riesgos?.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <TriangleAlert className="size-4 text-yellow-500" aria-hidden="true" />
                        Riesgos identificados
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {resultado.riesgos.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {resultado.puntosPositivos?.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                        Puntos positivos
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {resultado.puntosPositivos.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Observaciones IA */}
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                  Observaciones IA
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{resultado.observaciones}&rdquo;
                </p>
              </div>

              {resultado.recomendacion && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">Recomendacion: </span>
                  {resultado.recomendacion}
                </p>
              )}

              {/* Verificación legal — colapsable */}
              {resultado.verificacionLegal && (
                <>
                  <Separator />
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowLegal((v) => !v)}
                      className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-foreground"
                    >
                      <span className="flex items-center gap-1.5">
                        <Scale className="size-4 text-primary" aria-hidden="true" />
                        Verificacion legal (InfoLEG)
                      </span>
                      {showLegal
                        ? <ChevronUp className="size-4 text-muted-foreground" aria-hidden="true" />
                        : <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                      }
                    </button>
                    {showLegal && (
                      <div className="mt-3 flex flex-col gap-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <InfoLegal label="Régimen aplicable" value={resultado.verificacionLegal.regimen} />
                          <InfoLegal label="Plazo mínimo" value={resultado.verificacionLegal.plazosMinimos} />
                          <InfoLegal label="Depósito máximo" value={resultado.verificacionLegal.deposito} />
                          <InfoLegal label="Índice de ajuste" value={resultado.verificacionLegal.indiceAjuste} />
                        </div>
                        <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
                          {resultado.verificacionLegal.observacionesLegales}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function InfoLegal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
