'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUp } from 'lucide-react'
import { formatARS, formatPct, proyectarConFechas, MESES, type ProyeccionFecha } from '@/lib/rent-data'

type IndiceReal = {
  id: string
  nombre: string
  descripcion: string
  ultimoValor: number
  ultimaFecha: string
  tasaMensualEstimada: number
  variacionAnual: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Opción de acuerdo libre (post DNU 70/2023): no viene del BCRA, se pacta.
const LIBRE: IndiceReal = {
  id: 'libre',
  nombre: 'Acuerdo libre',
  descripcion: 'Porcentaje pactado libremente entre las partes (habilitado por el DNU 70/2023).',
  ultimoValor: 0,
  ultimaFecha: '',
  tasaMensualEstimada: 4,
  variacionAnual: 0,
}

const AHORA = new Date()

export function RentSimulator() {
  const { data, isLoading } = useSWR<{ indices: IndiceReal[]; fuente: string }>(
    '/api/indices',
    fetcher,
    { revalidateOnFocus: false },
  )

  const indices: IndiceReal[] = useMemo(() => {
    const reales = data?.indices ?? []
    return [...reales, LIBRE]
  }, [data])

  const [monto, setMonto] = useState(450000)
  const [indiceId, setIndiceId] = useState('icl')
  const [frecuencia, setFrecuencia] = useState(3)
  const [duracion, setDuracion] = useState(36)
  const [tasaLibre, setTasaLibre] = useState(4)
  const [mesInicio, setMesInicio] = useState(AHORA.getMonth())
  const [anioInicio, setAnioInicio] = useState(AHORA.getFullYear())

  const indice = indices.find((i) => i.id === indiceId) ?? indices[0] ?? LIBRE
  const tasaMensual = indice.id === 'libre' ? tasaLibre : indice.tasaMensualEstimada

  // Multiplicador de ajuste = crecimiento compuesto durante los meses de cada período.
  const multiplicadorAjuste = useMemo(
    () => Math.pow(1 + tasaMensual / 100, frecuencia),
    [tasaMensual, frecuencia],
  )

  const proyeccion = useMemo(
    () =>
      proyectarConFechas({
        montoInicial: monto,
        multiplicadorAjuste,
        frecuenciaAjusteMeses: frecuencia,
        duracionMeses: duracion,
        mesInicio,
        anioInicio,
      }),
    [monto, multiplicadorAjuste, frecuencia, duracion, mesInicio, anioInicio],
  )

  const final = proyeccion[proyeccion.length - 1]
  const totalPagado = proyeccion.reduce((acc, p) => acc + p.alquiler, 0)
  const incrementoPct = monto > 0 ? ((final.alquiler - monto) / monto) * 100 : 0
  const ajustes = proyeccion.filter((p) => p.esAjuste)

  const aniosDisponibles = [anioInicio - 1, anioInicio, anioInicio + 1, anioInicio + 2]

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Simulador de ajuste de alquiler
          </h1>
          <Badge variant="secondary" className="font-normal">
            Datos reales del BCRA
          </Badge>
        </div>
        <p className="mt-1 text-muted-foreground text-pretty">
          Poné el mes en que arrancás y mirá, mes por mes, cuándo te aumentan y cuánto vas a pagar
          durante todo el contrato.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del alquiler</CardTitle>
            <CardDescription>Completá los datos de tu contrato.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="monto">¿Cuánto pagás de alquiler por mes? (ARS)</Label>
              <Input
                id="monto"
                type="number"
                min={0}
                step={10000}
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mes-inicio">Mes de inicio</Label>
                <Select value={String(mesInicio)} onValueChange={(v) => setMesInicio(Number(v))}>
                  <SelectTrigger id="mes-inicio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m, idx) => (
                      <SelectItem key={m} value={String(idx)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="anio-inicio">Año</Label>
                <Select value={String(anioInicio)} onValueChange={(v) => setAnioInicio(Number(v))}>
                  <SelectTrigger id="anio-inicio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aniosDisponibles.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="indice">¿Con qué índice te ajustan?</Label>
              <Select value={indiceId} onValueChange={(v) => setIndiceId(v ?? 'icl')}>
                <SelectTrigger id="indice">
                  <SelectValue placeholder={isLoading ? 'Cargando índices…' : 'Elegí un índice'} />
                </SelectTrigger>
                <SelectContent>
                  {indices.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nombre}
                      {i.id !== 'libre' ? ` · ~${i.tasaMensualEstimada}%/mes` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">{indice.descripcion}</p>
              {indice.id !== 'libre' && indice.ultimaFecha && (
                <p className="text-xs text-muted-foreground">
                  Último valor oficial: <span className="font-mono">{indice.ultimoValor}</span> (
                  {indice.ultimaFecha}) · var. interanual {formatPct(indice.variacionAnual)}
                </p>
              )}
            </div>

            {indice.id === 'libre' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="tasa-libre">Aumento mensual pactado (%)</Label>
                <Input
                  id="tasa-libre"
                  type="number"
                  min={0}
                  step={0.5}
                  value={tasaLibre}
                  onChange={(e) => setTasaLibre(Number(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="frecuencia">¿Cada cuánto te aumentan?</Label>
              <Select value={String(frecuencia)} onValueChange={(v) => setFrecuencia(Number(v))}>
                <SelectTrigger id="frecuencia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Todos los meses</SelectItem>
                  <SelectItem value="3">Cada 3 meses (trimestral)</SelectItem>
                  <SelectItem value="4">Cada 4 meses (cuatrimestral)</SelectItem>
                  <SelectItem value="6">Cada 6 meses (semestral)</SelectItem>
                  <SelectItem value="12">Cada 12 meses (anual)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="duracion">¿Cuánto dura el contrato?</Label>
              <Select value={String(duracion)} onValueChange={(v) => setDuracion(Number(v))}>
                <SelectTrigger id="duracion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">1 año (12 meses)</SelectItem>
                  <SelectItem value="24">2 años (24 meses)</SelectItem>
                  <SelectItem value="36">3 años (36 meses)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Vas a terminar pagando"
              value={formatARS(final.alquiler)}
              hint={`en ${final.etiqueta}`}
            />
            <StatCard
              label="Aumento total"
              value={formatPct(incrementoPct)}
              hint="sobre lo que pagás hoy"
              accent
            />
            <StatCard
              label="Total durante el contrato"
              value={formatARS(totalPagado)}
              hint={`${duracion} meses`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cómo evoluciona tu alquiler</CardTitle>
              <CardDescription>
                Desde {MESES[mesInicio]} {anioInicio} · ajuste cada {frecuencia}{' '}
                {frecuencia === 1 ? 'mes' : 'meses'} con {indice.nombre}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={proyeccion} margin={{ left: 4, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="fillAlquiler" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="etiquetaCorta"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      interval={Math.max(0, Math.floor(duracion / 6) - 1)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={64}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      formatter={(value) => [formatARS(Number(value)), 'Alquiler']}
                      labelFormatter={(l) => String(l)}
                      contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--popover-foreground)',
                        fontSize: 13,
                      }}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="alquiler"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#fillAlquiler)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {data?.fuente ?? 'BCRA · Estadísticas Monetarias'}. Las tasas se calculan con la
                variación real de los últimos meses; los valores futuros son una estimación.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cuándo y cuánto te aumentan</CardTitle>
              <CardDescription>
                Cada fila es un mes en el que se aplica un ajuste sobre tu alquiler.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ajustes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Con esta configuración no hay aumentos durante el contrato.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">Cuándo</th>
                        <th className="px-4 py-2 font-medium">Nuevo alquiler</th>
                        <th className="px-4 py-2 font-medium">Aumento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {proyeccion[0].etiqueta} <span className="text-xs">(inicio)</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-medium text-foreground">
                          {formatARS(monto)}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">—</td>
                      </tr>
                      {ajustes.map((a) => (
                        <tr key={a.indice}>
                          <td className="px-4 py-2.5 text-foreground">{a.etiqueta}</td>
                          <td className="px-4 py-2.5 font-mono font-medium text-foreground">
                            {formatARS(a.alquiler)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1 font-medium text-primary">
                              <ArrowUp className="h-3.5 w-3.5" />
                              {formatPct(a.aumentoPct)}
                              <span className="text-xs font-normal text-muted-foreground">
                                (+{formatARS(a.diffPesos)})
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={`mt-1 font-mono text-2xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}
