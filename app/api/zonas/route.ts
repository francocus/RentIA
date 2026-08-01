import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { marketListings } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export type ZonaStats = {
  zonaId: string
  nombre: string
  ciudad: string
  muestras: number
  precioPromedio: number
  precioMin: number
  precioMax: number
}

// Calcula promedio, mínimo y máximo de alquiler por zona directamente desde
// los contratos guardados en la base (tabla market_listings).
export async function GET() {
  try {
    const rows = await db
      .select({
        zonaId: marketListings.zonaId,
        nombre: marketListings.zona,
        ciudad: marketListings.ciudad,
        muestras: sql<number>`count(*)::int`,
        precioPromedio: sql<number>`round(avg(${marketListings.alquiler}))::int`,
        precioMin: sql<number>`min(${marketListings.alquiler})::int`,
        precioMax: sql<number>`max(${marketListings.alquiler})::int`,
      })
      .from(marketListings)
      .groupBy(marketListings.zonaId, marketListings.zona, marketListings.ciudad)
      .orderBy(sql`round(avg(${marketListings.alquiler})) desc`)

    return NextResponse.json({ zonas: rows as ZonaStats[] })
  } catch (err) {
    console.error('[v0] /api/zonas error:', err)
    return NextResponse.json(
      { error: 'No se pudieron cargar los precios de mercado.' },
      { status: 500 },
    )
  }
}
