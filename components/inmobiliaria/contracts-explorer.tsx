'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type Contrato = {
  id: number
  barrio: string | null
  zona: string | null
  ambientes: number | null
  m2: number | null
  alquiler: number | null
  ajuste: string | null
  plazo: string | null
  regimen: string | null
  fechaContrato: string | null
  resumen: string | null
  createdAt: Date
}

function formatPesos(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-AR', { year: 'numeric', month: 'short' })
}

function regimenBadge(r: string | null) {
  if (!r) return null
  const isDnu = r.includes('DNU')
  return (
    <Badge variant={isDnu ? 'default' : 'secondary'} className="text-xs">
      {r}
    </Badge>
  )
}

const BARRIOS = ['Todos', 'Centro', 'Pichincha', 'Puerto Norte', 'Fisherton', 'Echesortu', 'Barrio Martin', 'Lourdes', 'Abasto']
const AMBIENTES = ['Todos', '1', '2', '3', '4+']
const SORT_OPTIONS = [
  { value: 'fecha_desc', label: 'Más reciente' },
  { value: 'alquiler_asc', label: 'Menor precio' },
  { value: 'alquiler_desc', label: 'Mayor precio' },
]

export function ContractsExplorer({ contratos }: { contratos: Contrato[] }) {
  const [barrio, setBarrio] = useState('Todos')
  const [ambientes, setAmbientes] = useState('Todos')
  const [sort, setSort] = useState('fecha_desc')
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = useMemo(() => {
    let list = [...contratos]
    if (barrio !== 'Todos') list = list.filter(c => c.barrio === barrio)
    if (ambientes !== 'Todos') {
      if (ambientes === '4+') list = list.filter(c => (c.ambientes ?? 0) >= 4)
      else list = list.filter(c => c.ambientes === Number(ambientes))
    }
    if (sort === 'alquiler_asc') list.sort((a, b) => (a.alquiler ?? 0) - (b.alquiler ?? 0))
    else if (sort === 'alquiler_desc') list.sort((a, b) => (b.alquiler ?? 0) - (a.alquiler ?? 0))
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return list
  }, [contratos, barrio, ambientes, sort])

  const avgAlquiler = useMemo(() => {
    const withPrice = filtered.filter(c => c.alquiler)
    if (!withPrice.length) return null
    return Math.round(withPrice.reduce((s, c) => s + (c.alquiler ?? 0), 0) / withPrice.length)
  }, [filtered])

  return (
    <div className="flex flex-col gap-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-extrabold text-foreground">{filtered.length}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">contratos encontrados</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-extrabold text-foreground">
            {avgAlquiler ? formatPesos(avgAlquiler) : '—'}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">alquiler promedio</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 col-span-2 sm:col-span-1">
          <p className="text-2xl font-extrabold text-foreground">{BARRIOS.length - 1}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">barrios cubiertos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Select value={barrio} onValueChange={(v) => v && setBarrio(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Barrio" />
          </SelectTrigger>
          <SelectContent>
            {BARRIOS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ambientes} onValueChange={(v) => v && setAmbientes(v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Ambientes" />
          </SelectTrigger>
          <SelectContent>
            {AMBIENTES.map(a => <SelectItem key={a} value={a}>{a === 'Todos' ? 'Todos' : `${a} amb.`}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => v && setSort(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          No hay contratos que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Barrio</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Amb.</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Alquiler</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground hidden sm:table-cell">Ajuste</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground hidden md:table-cell">Régimen</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground hidden lg:table-cell">Fecha</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <>
                  <tr
                    key={c.id}
                    className="cursor-pointer transition-colors hover:bg-secondary/40"
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{c.barrio ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.ambientes ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {c.alquiler ? formatPesos(c.alquiler) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{c.ajuste ?? '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{regimenBadge(c.regimen)}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatDate(c.fechaContrato)}</td>
                    <td className="px-4 py-3 text-right">
                      {expanded === c.id
                        ? <ChevronUp className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
                        : <ChevronDown className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />}
                    </td>
                  </tr>
                  {expanded === c.id && (
                    <tr key={`${c.id}-detail`} className="bg-secondary/20">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Superficie</p>
                            <p className="mt-0.5 text-sm text-foreground">{c.m2 ? `${c.m2} m²` : '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plazo</p>
                            <p className="mt-0.5 text-sm text-foreground">{c.plazo ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha contrato</p>
                            <p className="mt-0.5 text-sm text-foreground">{formatDate(c.fechaContrato)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Régimen</p>
                            <p className="mt-0.5">{regimenBadge(c.regimen) ?? '—'}</p>
                          </div>
                        </div>
                        {c.resumen && (
                          <div className="mt-3 rounded-lg border border-border bg-card p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observación de la IA</p>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.resumen}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
