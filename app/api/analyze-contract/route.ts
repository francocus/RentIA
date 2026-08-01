import { generateText, Output } from 'ai'
import { z } from 'zod'

export const maxDuration = 30

const analysisSchema = z.object({
  resumen: z.string().describe('Resumen del contrato en 2-3 oraciones, en español rioplatense claro.'),
  indiceActualizacion: z
    .string()
    .describe('Índice o mecanismo de ajuste detectado (ICL, IPC, acuerdo libre, etc.) o "No especificado".'),
  frecuenciaAjuste: z.string().describe('Cada cuánto se actualiza el alquiler, o "No especificado".'),
  duracion: z.string().describe('Duración del contrato detectada, o "No especificado".'),
  puntosClave: z.array(z.string()).describe('3 a 6 puntos importantes explicados en lenguaje simple.'),
  clausulasRiesgosas: z
    .array(
      z.object({
        titulo: z.string(),
        detalle: z.string(),
        severidad: z.enum(['alta', 'media', 'baja']),
      }),
    )
    .describe('Cláusulas potencialmente perjudiciales o poco claras para el inquilino.'),
  preguntasSugeridas: z
    .array(z.string())
    .describe('Preguntas que el inquilino debería hacerle al propietario o inmobiliaria antes de firmar.'),
})

export async function POST(req: Request) {
  const { contrato } = await req.json()

  if (!contrato || typeof contrato !== 'string' || contrato.trim().length < 40) {
    return Response.json(
      { error: 'Pegá el texto del contrato (al menos algunas cláusulas) para poder analizarlo.' },
      { status: 400 },
    )
  }

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4.1-mini',
      output: Output.object({ schema: analysisSchema }),
      system:
        'Sos un asistente legal experto en contratos de locación de vivienda en Argentina. ' +
        'Explicás en español rioplatense, claro y sin jerga. Tu objetivo es proteger al inquilino: ' +
        'detectás ajustes, plazos, garantías, cláusulas abusivas y riesgos. No inventás datos: si algo ' +
        'no figura en el texto, lo marcás como "No especificado". No das asesoramiento legal vinculante, ' +
        'sino orientación para entender el contrato.',
      prompt: `Analizá el siguiente contrato de alquiler y devolvé el análisis estructurado.\n\n"""${contrato.slice(0, 12000)}"""`,
    })

    return Response.json(output)
  } catch (err) {
    console.log('[v0] Error analizando contrato:', err instanceof Error ? err.message : err)
    return Response.json(
      { error: 'No se pudo analizar el contrato. Verificá que AI_GATEWAY_API_KEY esté configurada.' },
      { status: 500 },
    )
  }
}
