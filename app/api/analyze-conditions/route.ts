import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { marketListings } from '@/lib/db/schema'
import { formatARS } from '@/lib/rent-data'
import { getSessionUserFromRequest } from '@/lib/session'

export const maxDuration = 45

const evaluacionSchema = z.object({
  conclusion: z
    .enum(['conveniente', 'para-revisar', 'poco-conveniente'])
    .describe('Conclusión general sobre las condiciones pedidas, desde la óptica del inquilino.'),
  resumen: z
    .string()
    .describe('Resumen en 2-3 oraciones, en español rioplatense simple y sin jerga legal.'),
  queTePiden: z
    .array(z.string())
    .describe('Lista clara de lo que le están pidiendo al inquilino (depósito, garantía, plazo, ajuste, etc.).'),
  condicionesHabituales: z
    .array(z.string())
    .describe('Qué condiciones son habituales o razonables en el mercado actual de Rosario.'),
  aNegociar: z
    .array(z.string())
    .describe('Puntos concretos que el inquilino debería consultar o intentar negociar antes de avanzar.'),
  comparacionZona: z
    .string()
    .describe('Comparación del precio/condiciones con otros alquileres de la zona, usando los datos provistos.'),
})

async function contextoZona(zonaId?: string, ambientes?: number): Promise<string> {
  if (!zonaId) return 'No se indicó una zona específica.'
  try {
    const cond =
      ambientes && ambientes > 0
        ? sql`${marketListings.zonaId} = ${zonaId} and ${marketListings.ambientes} = ${ambientes}`
        : sql`${marketListings.zonaId} = ${zonaId}`
    const rows = await db
      .select({
        nombre: marketListings.zona,
        ciudad: marketListings.ciudad,
        muestras: sql<number>`count(*)::int`,
        promedio: sql<number>`round(avg(${marketListings.alquiler}))::int`,
        minimo: sql<number>`min(${marketListings.alquiler})::int`,
        maximo: sql<number>`max(${marketListings.alquiler})::int`,
      })
      .from(marketListings)
      .where(cond)
      .groupBy(marketListings.zona, marketListings.ciudad)

    const r = rows[0]
    if (!r || r.muestras === 0) return `No hay contratos de referencia para la zona "${zonaId}".`
    return (
      `Zona ${r.nombre} (${r.ciudad})${ambientes ? `, ${ambientes} ambientes` : ''}: ` +
      `promedio ${formatARS(r.promedio)} por mes ` +
      `(rango ${formatARS(r.minimo)} a ${formatARS(r.maximo)}), sobre ${r.muestras} contratos reales.`
    )
  } catch {
    return 'No se pudo obtener el contexto de la zona.'
  }
}

export async function POST(req: Request) {
  const user = await getSessionUserFromRequest(req)
  if (!user) {
    return Response.json(
      { error: 'Necesitás una cuenta para usar el análisis con IA. Creá tu cuenta gratis.' },
      { status: 401 },
    )
  }

  const { condiciones, zonaId, ambientes } = await req.json()

  if (typeof condiciones !== 'string' || condiciones.trim().length < 15) {
    return Response.json(
      { error: 'Contanos con un poco más de detalle qué condiciones te piden.' },
      { status: 400 },
    )
  }

  const refZona = await contextoZona(
    typeof zonaId === 'string' ? zonaId : undefined,
    ambientes ? Number(ambientes) : undefined,
  )

  try {
    const { output } = await generateText({
      model: google('gemini-flash-latest'),
      output: Output.object({ schema: evaluacionSchema }),
      system:
        'Sos un asesor que ayuda a inquilinos en Rosario, Argentina, a decidir antes de firmar un ' +
        'alquiler. Hablás en español rioplatense, claro y sin jerga. Te describen las condiciones que ' +
        'les piden (depósito, garantía, plazo, forma y frecuencia de ajuste, expensas, etc.) y vos ' +
        'evaluás si son razonables para el mercado actual (post DNU 70/2023, con libre pacto de plazo, ' +
        'moneda, índice y frecuencia). No inventás datos: si algo no está claro, lo marcás como punto a ' +
        'consultar. Tu conclusión debe ser una de: conveniente, para-revisar o poco-conveniente.\n\n' +
        `DATO DE MERCADO DE LA ZONA (usalo para la comparación):\n${refZona}`,
      prompt:
        'Evaluá las siguientes condiciones que le piden a un inquilino y devolvé la evaluación ' +
        `estructurada:\n\n"""${condiciones.slice(0, 4000)}"""`,
    })

    return Response.json(output)
  } catch (err) {
    console.log('[v0] Error evaluando condiciones:', err instanceof Error ? err.message : err)
    return Response.json(
      {
        error:
          'No se pudo evaluar las condiciones. Verificá que la API key de Gemini (GOOGLE_GENERATIVE_AI_API_KEY) esté configurada.',
      },
      { status: 500 },
    )
  }
}
