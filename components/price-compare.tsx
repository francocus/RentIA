'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
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
import { formatARS } from '@/lib/rent-data'
import type { ZonaStats } from '@/app/api/zonas/route'

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const AMBIENTES = ['1', '2', '3', '4']

type Tono = 'bajo' | 'habitual' | 'alto'

export function PriceCompare() {
  const [ambientes, setAmbientes] = useState('2')
  const { data, isLoading } = useSWR<{ zonas: ZonaStats[] }>(
    `/api/zonas?ambientes=${ambientes}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )
  const zonas = data?.zonas ?? []

  const [zonaId, setZonaId] = useState<string | null>(null)
  const [precio, setPrecio] = useState(400000)

  const zona = zonas.find((z) => z.zonaId === zonaId) ?? zonas[0]

  const diffPct = zona ? ((precio - zona.precioPromedio) / zona.precioPromedio) * 100 : 0

  const veredicto = useMemo((): { tono: Tono; label: string } => {
    if (!zona) return { tono: 'habitual', label: 'Dentro de lo habitual' }
    if (precio < zona.precioMin) return { tono: 'bajo', label: 'Bajo' }
    if (precio > zona.precioMax) return { tono: 'alto', label: 'Alto' }
    return { tono: 'habitual', label: 'Dentro de lo habitual' }
  }, [zona, precio])

  // Escala visual: dominio con margen a ambos lados del rango de la zona.
  const escala = useMemo(() => {
    if (!zona) return null
    const domainMin = Math.min(zona.precioMin, precio) * 0.9
    const domainMax = Math.max(zona.precioMax, precio) * 1.1
    const span = Math.max(domainMax - domainMin, 1)
    const pct = (v: number) => Math.min(100, Math.max(0, ((v - domainMin) / span) * 100))
    return {
      loPct: pct(zona.precioMin),
      hiPct: pct(zona.precioMax),
      promPct: pct(zona.precioPromedio),
      precioPct: pct(precio),
    }
  }, [zona, precio])

  const frase = useMemo(() => {
    if (!zona) return ''
    const abs = Math.abs(Math.round(diffPct))
    if (abs <= 2) return 'El precio que te piden está en línea con el valor habitual de la zona.'
    const dir = diffPct > 0 ? 'por encima' : 'por debajo'
    return `El precio que te piden está un ${abs}% ${dir} del valor habitual para propiedades similares en esta zona.`
  }, [zona, diffPct])

  const toneClasses: Record<Tono, string> = {
    bajo: 'bg-primary text-primary-foreground',
    habitual: 'bg-secondary text-secondary-foreground',
    alto: 'bg-destructive text-white',
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del alquiler</CardTitle>
          <CardDescription>Valores según contratos reales de la base de datos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ambientes">Cantidad de ambientes</Label>
            <Select value={ambientes} onValueChange={(v) => setAmbientes(v ?? '2')}>
              <SelectTrigger id="ambientes">
                <SelectValue />
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="zona">Zona o barrio de Rosario</Label>
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
                    {z.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="precio">Precio mensual que te piden</Label>
            <Input
              id="precio"
              type="number"
              min={0}
              step={10000}
              value={precio}
              onChange={(e) => setPrecio(Number(e.target.value) || 0)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">{formatARS(precio)} por mes</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Valor habitual de la zona</span>
              <span className="font-semibold text-foreground">
                {zona ? formatARS(zona.precioPromedio) : '—'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Rango habitual</span>
              <span className="font-medium text-foreground">
                {zona ? `${formatARS(zona.precioMin)} a ${formatARS(zona.precioMax)}` : '—'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Contratos comparados</span>
              <span className="font-medium text-foreground">{zona ? zona.muestras : '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {zona ? `${zona.nombre}, Rosario` : 'Resultado'}
          </CardTitle>
          <CardDescription>Comparamos tu precio con los valores habituales de la zona.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {!zona ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              {isLoading ? 'Cargando precios de mercado…' : 'No hay datos de mercado disponibles.'}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`${toneClasses[veredicto.tono]} px-3 py-1 text-sm`}>
                  {veredicto.label}
                </Badge>
                <p className="text-pretty text-sm leading-relaxed text-foreground">{frase}</p>
              </div>

              {escala && (
                <div className="flex flex-col gap-3">
                  {/* Escala visual: bajo / habitual / alto */}
                  <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 bg-secondary"
                      style={{ width: `${escala.loPct}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-y-0 bg-primary/70"
                      style={{ left: `${escala.loPct}%`, width: `${escala.hiPct - escala.loPct}%` }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute inset-y-0 right-0 bg-destructive/70"
                      style={{ width: `${100 - escala.hiPct}%` }}
                      aria-hidden="true"
                    />
                    {/* Marcador de tu precio */}
                    <div
                      className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow"
                      style={{ left: `${escala.precioPct}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Bajo</span>
                    <span>Dentro de lo habitual</span>
                    <span>Alto</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tu precio: <span className="font-semibold text-foreground">{formatARS(precio)}</span>{' '}
                    · Valor habitual:{' '}
                    <span className="font-semibold text-foreground">{formatARS(zona.precioPromedio)}</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <Marca label="Más barato" value={formatARS(zona.precioMin)} />
                <Marca label="Habitual" value={formatARS(zona.precioPromedio)} destacado />
                <Marca label="Más caro" value={formatARS(zona.precioMax)} />
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Fuente: contratos reales registrados en RentIA para {zona.nombre} ({zona.muestras}{' '}
                {zona.muestras === 1 ? 'contrato' : 'contratos'} de {ambientes === '4' ? '4 o más' : ambientes}{' '}
                ambiente{ambientes === '1' ? '' : 's'}). Los valores son orientativos.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Marca({ label, value, destacado }: { label: string; value: string; destacado?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 text-center ${
        destacado ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/40'
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
