import { getIndicesReales } from '@/lib/bcra'

export const revalidate = 21600 // 6 horas

export async function GET() {
  try {
    const indices = await getIndicesReales()
    return Response.json({ indices, fuente: 'BCRA · Estadísticas Monetarias v4.0' })
  } catch (err) {
    console.log('[v0] Error consultando BCRA:', err instanceof Error ? err.message : err)
    return Response.json(
      { error: 'No se pudieron obtener los índices del BCRA en este momento.' },
      { status: 502 },
    )
  }
}
