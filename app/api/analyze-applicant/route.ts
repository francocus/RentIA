'use server'
import { google } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { applicantAnalyses } from '@/lib/db/schema'

export const maxDuration = 60

const verificacionLegalSchema = z.object({
  regimen: z
    .string()
    .describe('Régimen legal aplicable: Ley 27.551, DNU 70/2023, Ley 27.737 u otro.'),
  plazosMinimos: z
    .string()
    .describe('Plazo mínimo legal vigente para locaciones de vivienda.'),
  deposito: z
    .string()
    .describe('Monto máximo de depósito permitido según la ley vigente.'),
  indiceAjuste: z
    .string()
    .describe('Índice de ajuste vigente y frecuencia según la ley aplicable.'),
  observacionesLegales: z
    .string()
    .describe('Observaciones legales relevantes para el análisis del postulante y el contrato que se va a firmar.'),
})

const applicantSchema = z.object({
  estado: z
    .enum(['aprobado', 'revisar', 'rechazado'])
    .describe(
      '"aprobado" si la documentación es completa y consistente. "revisar" si hay observaciones menores o documentos faltantes. "rechazado" si hay inconsistencias graves o documentación insuficiente.',
    ),
  resumen: z
    .string()
    .describe('Resumen ejecutivo del postulante en 2-3 oraciones para uso interno de la inmobiliaria.'),
  documentosRecibidos: z
    .array(
      z.object({
        nombre: z.string(),
        estado: z.enum(['recibido', 'faltante']),
        observacion: z.string().optional().describe('Observación breve sobre el documento si aplica.'),
      }),
    )
    .describe('Lista de TODOS los documentos esperados con su estado. Incluir los no aportados como faltantes.'),
  documentosFaltantes: z
    .array(z.string())
    .describe('Lista de nombres de documentos faltantes para completar el expediente.'),
  ingresoDetectado: z.string().describe('Ingreso mensual detectado o informado. Vacío si no hay dato.'),
  relacionIngresosAlquiler: z
    .string()
    .describe('Evaluación de la relación ingresos/alquiler: si supera 3x el alquiler, es apto. Aclarar si no hay dato de alquiler.'),
  antiguedadLaboral: z.string().describe('Antigüedad laboral detectada. Vacío si no hay dato.'),
  tipoEmpleo: z.string().describe('Tipo de empleo detectado. Vacío si no hay dato.'),
  riesgos: z
    .array(z.string())
    .describe('Lista de riesgos o puntos de atención identificados en el expediente.'),
  puntosPositivos: z
    .array(z.string())
    .describe('Aspectos positivos del expediente del postulante.'),
  observaciones: z
    .string()
    .describe('Observaciones completas de la IA sobre la documentación, situación económica e inconsistencias detectadas.'),
  recomendacion: z.string().describe('Recomendación concreta para la inmobiliaria en 1-2 oraciones.'),
  verificacionLegal: verificacionLegalSchema.describe('Información legal relevante para el contrato a firmar.'),
})

export type AnalisisPostulante = z.infer<typeof applicantSchema>

const SYSTEM = `Sos un asistente de IA especializado en inmobiliarias argentinas. Tu tarea es analizar la información y documentación de un postulante a un alquiler en Rosario, Argentina.

Revisá los datos del formulario y la documentación aportada. Evaluá:
1. Completitud del expediente: qué documentos se aportaron y cuáles faltan
2. Solvencia económica: relación ingresos/alquiler (mínimo recomendado: 3x el valor del alquiler)
3. Situación laboral: estabilidad, antigüedad, tipo de empleo
4. Inconsistencias o riesgos detectados
5. Marco legal vigente para locaciones de vivienda en Argentina (DNU 70/2023 es el régimen actual para contratos nuevos)

Legislación vigente en Argentina (agosto 2026):
- DNU 70/2023: rige para contratos firmados desde enero 2024. Plazo mínimo 2 años. Ajuste libre (generalmente IPC o ICL). Depósito máximo: 1 mes.
- Ley 27.551 (Ley de Alquileres): rigió entre julio 2020 y enero 2024 para contratos nuevos. Plazo mínimo 3 años. Ajuste por ICL cada 12 meses. Depósito 1 mes.
- Ley 27.737: modificó la Ley 27.551 (junio 2023 a enero 2024). Ajuste ICL cada 3 o 4 meses.

Sé objetivo, detallado y usa lenguaje claro. El análisis es para uso interno de la inmobiliaria.`

export async function POST(req: Request) {
  try {
    // Autenticación
    const session = await auth.api.getSession({ headers: await headers() })

    const body = await req.json()
    const { postulante, documentos, alquilerEstimado } = body as {
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
      alquilerEstimado?: string
    }

    const prompt = `DATOS DEL POSTULANTE:
- Nombre: ${postulante.nombre}
- DNI: ${postulante.dni}
- Email: ${postulante.email || 'No informado'}
- Teléfono: ${postulante.telefono || 'No informado'}
- Ingresos mensuales declarados: ${postulante.ingresos ? `$${Number(postulante.ingresos).toLocaleString('es-AR')}` : 'No informado'}
- Tipo de empleo: ${postulante.tipoEmpleo || 'No informado'}
- Antigüedad laboral: ${postulante.antiguedad || 'No informada'}
${alquilerEstimado ? `- Alquiler estimado de la propiedad: $${alquilerEstimado}` : ''}

DOCUMENTACIÓN APORTADA:
${documentos.length > 0 ? documentos.map((d) => `- ${d} (RECIBIDO)`).join('\n') : '- Ningún documento aportado'}

Documentos ESPERADOS para un expediente completo en Rosario:
- DNI (frente y dorso)
- Recibos de sueldo (últimos 3 meses) o documentación de ingresos
- Garantía propietaria (escritura del garante) o seguro de caución
- CUIL/CUIT si es monotributista o autónomo
- Referencias laborales o constancia de empleo

FECHA ACTUAL: agosto 2026. El régimen vigente para contratos nuevos es el DNU 70/2023.

Realizá un análisis completo del expediente y verificá el marco legal aplicable.`

    const { output } = await generateText({
      model: google('gemini-flash-latest'),
      output: Output.object({ schema: applicantSchema }),
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    // Guardar en historial si hay sesión activa
    if (session?.user) {
      await db.insert(applicantAnalyses).values({
        userId: session.user.id,
        nombre: postulante.nombre,
        dni: postulante.dni,
        email: postulante.email || null,
        telefono: postulante.telefono || null,
        ingresos: postulante.ingresos || null,
        tipoEmpleo: postulante.tipoEmpleo || null,
        antiguedad: postulante.antiguedad || null,
        documentos: documentos,
        estado: output.estado,
        resumen: output.resumen || null,
        observaciones: output.observaciones || null,
        recomendacion: output.recomendacion || null,
        documentosRecibidos: output.documentosRecibidos,
        ingresoDetectado: output.ingresoDetectado || null,
        antiguedadLaboral: output.antiguedadLaboral || null,
        verificacionLegal: output.verificacionLegal,
        resultado: output as Record<string, unknown>,
      })
    }

    return Response.json(output)
  } catch (err) {
    console.error('[analyze-applicant]', err)
    return Response.json(
      { error: 'No se pudo analizar el postulante. Verificá que GOOGLE_GENERATIVE_AI_API_KEY esté configurada.' },
      { status: 500 },
    )
  }
}
