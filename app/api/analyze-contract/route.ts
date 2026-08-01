import { google } from '@ai-sdk/google'
import { generateText, Output, isStepCount } from 'ai'
import { z } from 'zod'
import { marcoLegalParaPrompt, regimenPorFecha } from '@/lib/ley-alquileres'
import { conectarFuentesLegales } from '@/lib/legal-mcp'

// Las consultas a InfoLEG agregan latencia: damos más margen al análisis.
export const maxDuration = 120

const analysisSchema = z.object({
  resumen: z.string().describe('Resumen del contrato en 2-3 oraciones, en español rioplatense claro.'),
  fechaContratoDetectada: z
    .string()
    .describe('Fecha de celebración del contrato detectada (YYYY-MM-DD o texto), o "No especificada".'),
  regimenAplicable: z
    .string()
    .describe(
      'Nombre del régimen legal que rige el contrato según su fecha (Ley 27.551, Ley 27.737, DNU 70/2023 o régimen anterior).',
    ),
  esPosteriorNuevaLey: z
    .boolean()
    .describe('true si el contrato se rige por el DNU 70/2023 (desregulación, "nueva ley"); false si es anterior.'),
  analisisLegal: z
    .array(z.string())
    .describe(
      'Cómo encaja el contrato en su régimen y en qué se diferencia del régimen anterior (plazo, índice, frecuencia de ajuste). 2 a 5 puntos.',
    ),
  cumplimientoNormativo: z
    .array(
      z.object({
        aspecto: z.string().describe('Ej: plazo mínimo, índice de ajuste, frecuencia, depósito.'),
        estado: z.enum(['cumple', 'no-cumple', 'segun-pacto', 'no-determinado']),
        detalle: z.string(),
      }),
    )
    .describe('Chequeo de los puntos clave del contrato contra lo que exige o permite su régimen legal.'),
  indiceActualizacion: z
    .string()
    .describe('Índice o mecanismo de ajuste detectado (ICL, IPC, Casa Propia, acuerdo libre, etc.) o "No especificado".'),
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
  fuentesLegales: z
    .array(
      z.object({
        norma: z.string().describe('Ej: "Ley 26.994 (Código Civil y Comercial)", "DNU 70/2023".'),
        articulos: z.string().describe('Artículos citados, ej: "arts. 1196 y 1198", o "" si no aplica.'),
        relevancia: z.string().describe('Por qué esta norma es relevante para el contrato analizado, en 1 oración.'),
      }),
    )
    .describe(
      'Normas oficiales consultadas en InfoLEG que respaldan el análisis. Vacío solo si no se pudo consultar ninguna fuente.',
    ),
})

const SYSTEM =
  'Sos un asistente legal experto en contratos de locación de vivienda en Argentina. ' +
  'Explicás en español rioplatense, claro y sin jerga. Tu objetivo es proteger al inquilino: ' +
  'detectás ajustes, plazos, garantías, cláusulas abusivas y riesgos, y evaluás el contrato ' +
  'contra el régimen legal que le corresponde según su fecha de firma. No inventás datos: si algo ' +
  'no figura en el texto, lo marcás como "No especificado". No das asesoramiento legal vinculante, ' +
  'sino orientación para entender el contrato.\n\n' +
  'LÍNEA DE TIEMPO NORMATIVA DE ALQUILERES EN ARGENTINA (según fecha de firma del contrato):\n' +
  marcoLegalParaPrompt() +
  '\n\nLa "nueva ley" o desregulación es el DNU 70/2023 (vigente desde el 29/12/2023), que derogó ' +
  'la Ley de Alquileres y habilitó el libre pacto de plazo, moneda, índice y frecuencia de ajuste.' +
  '\n\nFUENTES OFICIALES: tenés herramientas para consultar InfoLEG (base oficial de legislación ' +
  'nacional del Ministerio de Justicia). Usalas para verificar el texto VIGENTE de las normas clave ' +
  'antes de afirmar qué exige o permite el régimen aplicable. Normas de referencia: Ley 26.994 ' +
  '(Código Civil y Comercial, arts. 1187 a 1226 sobre locación), Ley 27.551, Ley 27.737 y DNU 70/2023. ' +
  'Flujo sugerido: usá infoleg_resolver_id con tipo y número para obtener el id de la norma, y luego ' +
  'infoleg_obtener_texto_actualizado para leer los artículos pertinentes. Hacé como máximo 3 o 4 ' +
  'consultas, enfocadas en los puntos dudosos del contrato (plazo mínimo, ajuste, depósito, expensas, ' +
  'resolución anticipada). Citá lo consultado en el campo fuentesLegales del resultado.'

export async function POST(req: Request) {
  const user = await getSessionUserFromRequest(req)
  if (!user) {
    return Response.json(
      { error: 'Necesitás una cuenta para usar el análisis con IA. Creá tu cuenta gratis.' },
      { status: 401 },
    )
  }

  const { contrato, fileData, mediaType, fechaContrato } = await req.json()

  const tieneTexto = typeof contrato === 'string' && contrato.trim().length >= 40
  const tieneArchivo = typeof fileData === 'string' && fileData.length > 0 && typeof mediaType === 'string'

  if (!tieneTexto && !tieneArchivo) {
    return Response.json(
      { error: 'Pegá el texto del contrato o subí un archivo (PDF/imagen) para poder analizarlo.' },
      { status: 400 },
    )
  }

  // Si el usuario indicó la fecha, resolvemos el régimen de forma determinística
  // y se lo damos a la IA como dato autoritativo.
  const regimen =
    typeof fechaContrato === 'string' && fechaContrato ? regimenPorFecha(fechaContrato) : null

  const contextoFecha = regimen
    ? `\n\nDATO CONFIRMADO: el contrato fue firmado el ${fechaContrato}, por lo que se rige por "${regimen.nombre}" ` +
      `(plazo mínimo: ${regimen.plazoMinimo}; ajuste: ${regimen.ajuste}; índice: ${regimen.indice}). ` +
      `Usá esto como régimen aplicable y ${regimen.id === 'dnu-70-2023' ? 'marcá esPosteriorNuevaLey = true' : 'marcá esPosteriorNuevaLey = false'}.`
    : '\n\nNo se indicó la fecha de firma: inferila del texto y determiná el régimen aplicable según la línea de tiempo.'

  const instruccion =
    `Analizá el siguiente contrato de alquiler y devolvé el análisis estructurado, ` +
    `comparando lo pactado con lo que exige o permite su régimen legal.${contextoFecha}`

  // Construimos el contenido del mensaje: texto pegado y/o archivo adjunto.
  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'file'; data: string; mediaType: string }
  > = []

  if (tieneArchivo) {
    content.push({
      type: 'text',
      text:
        instruccion +
        '\n\nEl contrato está en el archivo adjunto (puede ser un PDF o una foto/escaneo). ' +
        'Leé todo su contenido, incluida la letra chica, y analizalo.',
    })
    content.push({ type: 'file', data: fileData, mediaType })
  } else {
    content.push({ type: 'text', text: `${instruccion}\n\n"""${contrato.slice(0, 12000)}"""` })
  }

  // Conectamos las herramientas de InfoLEG (legislación oficial). Si el servidor
  // no responde, el análisis sigue sin fuentes externas.
  const fuentesLegales = await conectarFuentesLegales()

  try {
    const { output } = await generateText({
      // Gemini es multimodal: analiza tanto texto como archivos (PDF e imágenes).
      // Usa la API key de Google directamente (GOOGLE_GENERATIVE_AI_API_KEY).
      model: google('gemini-flash-latest'),
      output: Output.object({ schema: analysisSchema }),
      system: SYSTEM,
      messages: [{ role: 'user', content }],
      // Herramientas de consulta a InfoLEG + tope de pasos: hasta 6 consultas
      // legales y 1 paso final para generar la salida estructurada.
      ...(fuentesLegales ? { tools: fuentesLegales.tools, stopWhen: isStepCount(7) } : {}),
    })

    return Response.json(output)
  } catch (err) {
    console.log('[v0] Error analizando contrato:', err instanceof Error ? err.message : err)
    return Response.json(
      {
        error:
          'No se pudo analizar el contrato. Si el archivo es una imagen poco legible, probá con mejor calidad. ' +
          'Verificá también que la API key de Gemini (GOOGLE_GENERATIVE_AI_API_KEY) esté configurada.',
      },
      { status: 500 },
    )
  } finally {
    await fuentesLegales?.client.close().catch(() => {})
  }
}
