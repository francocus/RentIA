// Acceso a la API pública de Estadísticas Monetarias del BCRA (v4.0).
// Docs: https://www.bcra.gob.ar/BCRAyVos/catalogo-de-APIs-banco-central.asp
// No requiere API key. Devuelve series diarias de coeficientes oficiales.

const BASE = 'https://api.bcra.gob.ar/estadisticas/v4.0/monetarias'

// IDs de variables del BCRA relevantes para actualización de alquileres.
export const BCRA_VARIABLES = {
  icl: { id: 40, nombre: 'ICL (BCRA)', descripcion: 'Índice para Contratos de Locación. Combina inflación (IPC) y salarios (RIPTE). Ley 27.551.' },
  cer: { id: 30, nombre: 'CER', descripcion: 'Coeficiente de Estabilización de Referencia. Sigue la inflación (IPC).' },
  uva: { id: 31, nombre: 'UVA', descripcion: 'Unidad de Valor Adquisitivo. Ajusta por inflación (CER).' },
  casaPropia: { id: 32, nombre: 'Casa Propia (UVI)', descripcion: 'Unidad de Vivienda. Referencia del coeficiente Casa Propia.' },
} as const

export type IndiceId = keyof typeof BCRA_VARIABLES

export type SeriePunto = { fecha: string; valor: number }

type BcraResponse = {
  status: number
  results?: Array<{ idVariable: number; detalle: Array<{ fecha: string; valor: number }> }>
  errorMessages?: string[]
}

function fmtFecha(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Trae la serie diaria de una variable entre dos fechas (ascendente por fecha). */
export async function fetchSerie(id: number, desde: Date, hasta: Date): Promise<SeriePunto[]> {
  const url = `${BASE}/${id}?desde=${fmtFecha(desde)}&hasta=${fmtFecha(hasta)}&limit=3000`
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'es-AR' },
    // El BCRA actualiza a diario; cacheamos 6 horas.
    next: { revalidate: 60 * 60 * 6 },
  })
  if (!res.ok) throw new Error(`BCRA ${id} respondió ${res.status}`)
  const json = (await res.json()) as BcraResponse
  const detalle = json.results?.[0]?.detalle ?? []
  return detalle
    .map((d) => ({ fecha: d.fecha, valor: d.valor }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Valor más cercano (hacia atrás) a una fecha dada dentro de la serie. */
export function valorEnFecha(serie: SeriePunto[], fecha: string): number | null {
  let encontrado: number | null = null
  for (const p of serie) {
    if (p.fecha <= fecha) encontrado = p.valor
    else break
  }
  return encontrado
}

/**
 * Calcula la tasa mensual promedio (%) de los últimos `meses` de una serie,
 * usando la variación total compuesta -> mensual equivalente.
 */
export function tasaMensualReciente(serie: SeriePunto[], meses = 3): number {
  if (serie.length < 2) return 0
  const ultimo = serie[serie.length - 1]
  const objetivo = new Date(ultimo.fecha)
  objetivo.setMonth(objetivo.getMonth() - meses)
  const base = valorEnFecha(serie, fmtFecha(objetivo)) ?? serie[0].valor
  if (base <= 0) return 0
  const factorTotal = ultimo.valor / base
  const tasaMensual = Math.pow(factorTotal, 1 / meses) - 1
  return Math.round(tasaMensual * 1000) / 10 // 1 decimal, en %
}

export type IndiceReal = {
  id: IndiceId
  nombre: string
  descripcion: string
  ultimoValor: number
  ultimaFecha: string
  tasaMensualEstimada: number
  variacionAnual: number
}

/** Resumen listo para la UI de todos los índices, con tasas reales del BCRA. */
export async function getIndicesReales(): Promise<IndiceReal[]> {
  const hasta = new Date()
  const desde = new Date()
  desde.setMonth(desde.getMonth() - 14) // ventana amplia para calcular interanual

  const entries = Object.entries(BCRA_VARIABLES) as [IndiceId, (typeof BCRA_VARIABLES)[IndiceId]][]

  const resultados = await Promise.all(
    entries.map(async ([id, meta]) => {
      const serie = await fetchSerie(meta.id, desde, hasta)
      const ultimo = serie[serie.length - 1]
      const tasaMensualEstimada = tasaMensualReciente(serie, 3)
      const doceAtras = new Date(ultimo.fecha)
      doceAtras.setMonth(doceAtras.getMonth() - 12)
      const base12 = valorEnFecha(serie, fmtFecha(doceAtras)) ?? serie[0].valor
      const variacionAnual = base12 > 0 ? Math.round((ultimo.valor / base12 - 1) * 1000) / 10 : 0
      return {
        id,
        nombre: meta.nombre,
        descripcion: meta.descripcion,
        ultimoValor: ultimo.valor,
        ultimaFecha: ultimo.fecha,
        tasaMensualEstimada,
        variacionAnual,
      } satisfies IndiceReal
    }),
  )

  return resultados
}
