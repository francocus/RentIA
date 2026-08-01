'use client'

import { useMemo, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatARS, formatPct, indices, proyectarAlquiler } from '@/lib/rent-data'

export function RentSimulator() {
  const [monto, setMonto] = useState(450000)
  const [indiceId, setIndiceId] = useState('icl')
  const [frecuencia, setFrecuencia] = useState(3)
  const [duracion, setDuracion] = useState(36)

  const indice = indices.find((i) => i.id === indiceId) ?? indices[0]

  const proyeccion = useMemo(
    () =>
      proyectarAlquiler({
        montoInicial: monto,
        tasaMensual: indice.tasaMensualEstimada,
        frecuenciaAjusteMeses: frecuencia,
        duracionMeses: duracion,
      }),
    [monto, indice.tasaMensualEstimada, frecuencia, duracion],
  )

  const final = proyeccion[proyeccion.length - 1]
  const totalPagado = proyeccion.slice(1).reduce((acc, p) => acc + p.alquiler, 0)
  const incrementoPct = ((final.alquiler - monto) / monto) * 100

  return (
    <section id="simulador" className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Simulador de ajuste de alquiler
        </h2>
        <p className="mt-1 text-muted-foreground">
          Proyectá cuánto vas a pagar durante todo el contrato según el índice de actualización.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del alquiler</CardTitle>
            <CardDescription>Ajustá los valores para ver la proyección.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="monto">Alquiler inicial (ARS / mes)</Label>
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="indice">Índice de actualización</Label>
              <Select value={indiceId} onValueChange={(v) => setIndiceId(v ?? 'icl')}>
                <SelectTrigger id="indice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {indices.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.nombre} · ~{i.tasaMensualEstimada}%/mes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-relaxed text-muted-foreground">{indice.descripcion}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="frecuencia">Frecuencia de ajuste</Label>
              <Select value={String(frecuencia)} onValueChange={(v) => setFrecuencia(Number(v))}>
                <SelectTrigger id="frecuencia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Trimestral (cada 3 meses)</SelectItem>
                  <SelectItem value="4">Cuatrimestral (cada 4 meses)</SelectItem>
                  <SelectItem value="6">Semestral (cada 6 meses)</SelectItem>
                  <SelectItem value="12">Anual (cada 12 meses)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="duracion">Duración del contrato</Label>
              <Select value={String(duracion)} onValueChange={(v) => setDuracion(Number(v))}>
                <SelectTrigger id="duracion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 meses</SelectItem>
                  <SelectItem value="24">24 meses</SelectItem>
                  <SelectItem value="36">36 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Alquiler final" value={formatARS(final.alquiler)} hint={`Mes ${duracion}`} />
            <StatCard
              label="Aumento total"
              value={formatPct(incrementoPct)}
              hint="sobre el valor inicial"
              accent
            />
            <StatCard label="Total a pagar" value={formatARS(totalPagado)} hint="durante el contrato" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolución del alquiler</CardTitle>
              <CardDescription>
                Proyección con {indice.nombre}, ajuste cada {frecuencia} meses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
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
                      dataKey="mes"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      tickFormatter={(m) => `M${m}`}
                      interval={Math.floor(duracion / 6)}
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
                      labelFormatter={(m) => `Mes ${m}`}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
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
