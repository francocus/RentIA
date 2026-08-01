import { BCRA_VARIABLES, fetchSerie, valorEnFecha, type IndiceId } from '@/lib/bcra'

export const revalidate = 21600

// Calcula el coeficiente de ajuste real entre dos fechas para un índice del BCRA.
// Ej: coeficiente ICL entre el inicio del contrato y hoy -> cuánto debería
// aumentar el alquiler según el índice oficial.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const indice = (searchParams.get('indice') ?? 'icl') as IndiceId
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta') ?? new Date().toISOString().slice(0, 10)

  const meta = BCRA_VARIABLES[indice]
  if (!meta) return Response.json({ error: 'Índice inválido.' }, { status: 400 })
  if (!desde || !/^\d{4}-\d{2}-\d{2}$/.test(desde)) {
    return Response.json({ error: 'Parámetro "desde" (YYYY-MM-DD) requerido.' }, { status: 400 })
  }

  try {
    const desdeDate = new Date(desde)
    const hastaDate = new Date(hasta)
    // ampliamos un poco hacia atrás para encontrar el valor más cercano
    const ventanaDesde = new Date(desdeDate)
    ventanaDesde.setDate(ventanaDesde.getDate() - 20)

    const serie = await fetchSerie(meta.id, ventanaDesde, hastaDate)
    const valorInicial = valorEnFecha(serie, desde)
    const valorFinal = valorEnFecha(serie, hasta)

    if (!valorInicial || !valorFinal) {
      return Response.json(
        { error: 'No hay datos del índice para esas fechas.' },
        { status: 404 },
      )
    }

    const coeficiente = valorFinal / valorInicial
    const variacionPct = Math.round((coeficiente - 1) * 1000) / 10

    return Response.json({
      indice: meta.nombre,
      desde,
      hasta,
      valorInicial,
      valorFinal,
      coeficiente: Math.round(coeficiente * 10000) / 10000,
      variacionPct,
      fuente: 'BCRA · Estadísticas Monetarias v4.0',
    })
  } catch (err) {
    console.log('[v0] Error calculando coeficiente:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'No se pudo calcular el coeficiente.' }, { status: 502 })
  }
}
