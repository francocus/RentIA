'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Scale,
  Sparkles,
  Trash2,
  TriangleAlert,
  User,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { deleteApplicantAnalysis } from '@/app/actions/applicant-analyses'
import type { AnalisisPostulante } from '@/app/api/analyze-applicant/route'

type Analysis = {
  id: number
  nombre: string
  dni: string
  email: string | null
  tipoEmpleo: string | null
  ingresoDetectado: string | null
  estado: string
  resumen: string | null
  observaciones: string | null
  recomendacion: string | null
  documentosRecibidos: unknown
  verificacionLegal: unknown
  resultado: unknown
  createdAt: Date
}

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof CheckCircle2; dot: string }> = {
  aprobado: { label: 'Apto para avanzar', variant: 'default', icon: CheckCircle2, dot: 'bg-primary' },
  revisar: { label: 'Requiere revisión', variant: 'secondary', icon: TriangleAlert, dot: 'bg-yellow-500' },
  rechazado: { label: 'Documentación insuficiente', variant: 'destructive', icon: XCircle, dot: 'bg-destructive' },
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function AnalysisRow({ analysis, onDelete }: { analysis: Analysis; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false)
  const estado = estadoConfig[analysis.estado] ?? estadoConfig.revisar
  const resultado = analysis.resultado as AnalisisPostulante
  const verificacion = analysis.verificacionLegal as AnalisisPostulante['verificacionLegal'] | null
  const docs = analysis.documentosRecibidos as AnalisisPostulante['documentosRecibidos']

  return (
    <div className="rounded-xl border border-border bg-card transition-colors">
      {/* Row header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <span className={`size-2.5 shrink-0 rounded-full ${estado.dot}`} aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{analysis.nombre}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              DNI {analysis.dni}
              {analysis.tipoEmpleo ? ` · ${analysis.tipoEmpleo}` : ''}
              {analysis.ingresoDetectado ? ` · ${analysis.ingresoDetectado}` : ''}
            </p>
          </div>
          <Badge variant={estado.variant} className="shrink-0 hidden sm:flex">
            {estado.label}
          </Badge>
          <p className="shrink-0 text-xs text-muted-foreground hidden md:block">
            {formatDate(analysis.createdAt)}
          </p>
        </div>
        {expanded
          ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          : <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        }
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={estado.variant}>{estado.label}</Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" aria-hidden="true" />
                {formatDate(analysis.createdAt)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(analysis.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground">{analysis.resumen}</p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {/* Documentos */}
            <div>
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <FileText className="size-3.5" aria-hidden="true" />
                Documentos
              </h3>
              <div className="flex flex-col gap-1.5">
                {Array.isArray(docs) && docs.map((doc: { nombre: string; estado: string }, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {doc.estado === 'recibido'
                      ? <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      : <XCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                    }
                    <span className={doc.estado === 'recibido' ? 'text-foreground' : 'text-muted-foreground line-through'}>
                      {doc.nombre}
                    </span>
                    {doc.estado === 'faltante' && (
                      <span className="text-xs text-destructive">(faltante)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Riesgos y puntos positivos */}
            <div className="flex flex-col gap-3">
              {resultado?.riesgos?.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <TriangleAlert className="size-3.5 text-yellow-500" aria-hidden="true" />
                    Riesgos
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {resultado.riesgos.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-yellow-500" aria-hidden="true" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resultado?.puntosPositivos?.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
                    Puntos positivos
                  </h3>
                  <ul className="flex flex-col gap-1">
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
          </div>

          {/* Observaciones IA */}
          {analysis.observaciones && (
            <>
              <Separator className="my-4" />
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                  Observaciones IA
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{analysis.observaciones}</p>
              </div>
            </>
          )}

          {/* Recomendación */}
          {analysis.recomendacion && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Recomendacion: </span>
              {analysis.recomendacion}
            </p>
          )}

          {/* Verificación legal */}
          {verificacion && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Scale className="size-3.5" aria-hidden="true" />
                  Verificacion legal (InfoLEG)
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <InfoLegal label="Régimen aplicable" value={verificacion.regimen} />
                  <InfoLegal label="Plazo mínimo" value={verificacion.plazosMinimos} />
                  <InfoLegal label="Depósito máximo" value={verificacion.deposito} />
                  <InfoLegal label="Índice de ajuste" value={verificacion.indiceAjuste} />
                </div>
                {verificacion.observacionesLegales && (
                  <p className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground">
                    {verificacion.observacionesLegales}
                  </p>
                )}
              </div>
            </>
          )}
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

export function ApplicantHistoryList({ initialAnalyses }: { initialAnalyses: Analysis[] }) {
  const [analyses, setAnalyses] = useState(initialAnalyses)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteApplicantAnalysis(id)
      setAnalyses((prev) => prev.filter((a) => a.id !== id))
    })
  }

  if (analyses.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
          <User className="size-7 text-muted-foreground" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Sin análisis guardados</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada análisis de postulante que realices se guardará aquí automáticamente.
          </p>
        </div>
        <Link
          href="/inmobiliaria/postulante"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Analizar primer postulante
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {analyses.length} {analyses.length === 1 ? 'análisis guardado' : 'análisis guardados'}
        </p>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" aria-hidden="true" /> Aprobado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-yellow-500" aria-hidden="true" /> Revisar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" aria-hidden="true" /> Rechazado
          </span>
        </div>
      </div>

      {analyses.map((analysis) => (
        <AnalysisRow key={analysis.id} analysis={analysis} onDelete={handleDelete} />
      ))}
    </div>
  )
}
