'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
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
import { formatARS, formatPct } from '@/lib/rent-data'
import type { ZonaStats } from '@/app/api/zonas/route'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PriceCompare() {
  const { data, isLoading } = useSWR<{ zonas: ZonaStats[] }>('/api/zonas', fetcher, {
    revalidateOnFocus: false,
  })
  const zonas = data?.zonas ?? []

  const [zonaId, setZonaId] = useState<string | null>(null)
  const [precio, setPrecio] = useState(650000)

  // Zona seleccionada: la elegida por el usuario o la primera disponible.
  const zona = zonas.find((z) => z.zonaId === zonaId) ?? zonas[0]

  const diffPct = zona ? ((precio - zona.precioPromedio) / zona.precioPromedio) * 100 : 0
  const veredicto = useMemo(() => {
    if (diffPct <= -8) return { label: 'Por debajo del mercado', tone: 'good' as const }
    if (diffPct >= 12) return { label: 'Por encima del mercado', tone: 'bad' as const }
    return { label: 'En línea con el mercado', tone: 'neutral' as const }
  }, [diffPct])

  const chartData = zona
    ? [
        { name: 'Mínimo', valor: zona.precioMin },
        { name: 'Promedio', valor: zona.precioPromedio },
        { name: 'Máximo', valor: zona.precioMax },
        { name: 'Tu precio', valor: precio },
      ]
    : []

  const totalMuestras = zonas.reduce((acc, z) => acc + z.muestras, 0)

  return (
    <section id="precios" className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Comparador de precios por zona</h2>
        <p className="mt-1 text-muted-foreground">
          Promedios calculados en base a{' '}
          <span className="font-medium text-foreground">{totalMuestras || '—'}</span> contratos reales
          registrados por zona.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu búsqueda</CardTitle>
            <CardDescription>Valores según contratos de la base de datos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="zona">Zona</Label>
              <Select
                value={zona?.zonaId ?? ''}
                onValueChange={(v) => setZonaId(v ?? null)}
                disabled={isLoading || zonas.length === 0}
              >
                <SelectTrigger id="zona">
                  <SelectValue placeholder={isLoading ? 'Cargando…' : 'Elegí una zona'} />
                </SelectTrigger>
                <SelectContent>
                  {zonas.map((z) => (
                    <SelectItem key={z.zonaId} value={z.zonaId}>
                      {z.nombre} — {z.ciudad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="precio">Precio que te piden (ARS / mes)</Label>
              <Input
                id="precio"
                type="number"
                min={0}
                step={10000}
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value) || 0)}
                className="font-mono"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Promedio de zona</span>
                <span className="font-mono font-semibold text-foreground">
                  {zona ? formatARS(zona.precioPromedio) : '—'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contratos analizados</span>
                <span className="font-mono font-semibold text-foreground">
                  {zona ? zona.muestras : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm text-muted-foreground">
                  Diferencia vs. promedio de {zona?.nombre ?? 'la zona'}
                </p>
                <p
                  className={`mt-1 font-mono text-3xl font-bold ${
                    veredicto.tone === 'bad'
                      ? 'text-destructive'
                      : veredicto.tone === 'good'
                        ? 'text-primary'
                        : 'text-foreground'
                  }`}
                >
                  {zona ? formatPct(diffPct) : '—'}
                </p>
              </div>
              {zona && (
                <Badge
                  variant={veredicto.tone === 'neutral' ? 'secondary' : 'default'}
                  className={
                    veredicto.tone === 'bad'
                      ? 'bg-destructive text-white'
                      : veredicto.tone === 'good'
                        ? 'bg-primary text-primary-foreground'
                        : ''
                  }
                >
                  {veredicto.label}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {zona ? `${zona.nombre} · ${zona.ciudad}` : 'Rango de la zona'}
              </CardTitle>
              <CardDescription>Tu precio comparado con el rango de la zona.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={64}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                        formatter={(value) => [formatARS(Number(value)), 'Valor']}
                        contentStyle={{
                          background: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          color: 'var(--popover-foreground)',
                          fontSize: 13,
                        }}
                      />
                      <ReferenceLine y={zona!.precioPromedio} stroke="var(--chart-3)" strokeDasharray="4 4" />
                      <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.name === 'Tu precio' ? 'var(--chart-3)' : 'var(--chart-1)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? 'Cargando precios de mercado…' : 'No hay datos de mercado disponibles.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
