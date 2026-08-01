import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscription } from '@/lib/db/schema'
import { getSessionUserFromRequest } from '@/lib/session'
import { isDemoPremiumUser } from '@/lib/subscription'

export const maxDuration = 60

const applicantSchema = z.object({
  estado: z
    .enum(['aprobado', 'revisar', 'rechazado'])
    .describe(
      '"aprobado" si la documentación es completa y consistente, "revisar" si hay observaciones menores o documentos faltantes, "rechazado" si hay inconsistencias graves o documentación insuficiente.',
    ),
  resumen: z
    .string()
    .describe('Resumen ejecutivo del postulante en 2-3 oraciones, para uso interno de la inmobiliaria.'),
  documentosRecibidos: z
    .array(
      z.object({
        nombre: z.string(),
        estado: z.enum(['recibido', 'faltante']),
      }),
    )
    .describe('Lista de todos los documentos esperados con su estado.'),
  ingresoDetectado: z
    .string()
    .describe('Ingreso mensual detectado o informado, ej: "$2.300.000". Vacío si no hay dato.'),
  antiguedadLaboral: z
    .string()
    .describe('Antigüedad laboral detectada, ej: "4 años". Vacío si no hay dato.'),
  tipoEmpleo: z
    .string()
    .describe('Tipo de empleo detectado, ej: "Relación de dependencia". Vacío si no hay dato.'),
  observaciones: z
    .string()
    .describe(
      'Observaciones de la IA sobre la documentación y la situación del postulante. Mencionar documentos faltantes, inconsistencias detectadas o aspectos positivos del expediente.',
    ),
  recomendacion: z
    .string()
    .describe('Recomendación concreta para la inmobiliaria en 1 oración.'),
})

export type AnalisisPostulante = z.infer<typeof applicantSchema>

const SYSTEM = `Sos un asistente de IA para inmobiliarias argentinas. Tu tarea es analizar la información y documentación de un postulante a un alquiler en Rosario.

Revisá los datos del formulario y la documentación aportada. Evaluá:
- Consistencia entre los datos del formulario y los documentos
- Documentos faltantes o incompletos
- Situación laboral y solvencia económica
- Riesgos o puntos a verificar

Sé objetivo y conciso. El análisis es para uso interno de la inmobiliaria, no se muestra directamente al postulante.`

export async function POST(req: Request) {
  try {
    const user = await getSessionUserFromRequest(req)
    if (!user) return Response.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 })
    const [sub] = await db.select().from(subscription).where(eq(subscription.userId, user.id))
    const hasPremium = Boolean(
      sub &&
        sub.status === 'active' &&
        sub.currentPeriodEnd &&
        sub.currentPeriodEnd > new Date(),
    )
    if (!isDemoPremiumUser(user.email) && ((user as { role?: string }).role !== 'inmobiliaria' || !hasPremium)) {
      return Response.json({ error: 'Necesitás una suscripción activa para analizar postulantes.' }, { status: 403 })
    }
    const body = await req.json()
    const { postulante, documentos } = body as {
      postulante: {
        nombre: string
        dni: string
        email: string
        telefono: string
        ingresos: string
        tipoEmpleo: string
        antiguedad: string
      }
      documentos: string[]
    }

    const prompt = `DATOS DEL POSTULANTE:
- Nombre: ${postulante.nombre}
- DNI: ${postulante.dni}
- Email: ${postulante.email}
- Teléfono: ${postulante.telefono}
- Ingresos mensuales declarados: ${postulante.ingresos ? `$${postulante.ingresos}` : 'No informado'}
- Tipo de empleo: ${postulante.tipoEmpleo || 'No informado'}
- Antigüedad laboral: ${postulante.antiguedad || 'No informada'}

DOCUMENTACIÓN APORTADA:
${documentos.length > 0 ? documentos.map((d) => `- ${d}`).join('\n') : '- Ningún documento aportado'}

Documentos esperados para un expediente completo: DNI, Recibo de sueldo, Garantía propietaria.

Analizá el expediente y devolvé tu evaluación.`

    const { output } = await generateText({
      model: google('gemini-flash-latest'),
      output: Output.object({ schema: applicantSchema }),
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    return Response.json(output)
  } catch (err) {
    console.error('[analyze-applicant]', err)
    return Response.json(
      {
        error:
          'No se pudo analizar el postulante. Verificá que la API key de Gemini (GOOGLE_GENERATIVE_AI_API_KEY) esté configurada.',
      },
      { status: 500 },
    )
  }
}
