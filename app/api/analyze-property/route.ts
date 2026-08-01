import { generateText, Output } from 'ai'
import { z } from 'zod'
import { zonas, formatARS } from '@/lib/rent-data'

export const maxDuration = 45

const evaluacionSchema = z.object({
  veredicto: z
    .enum(['caro', 'justo', 'barato', 'sin-referencia'])
    .describe('Valoración del precio pedido frente a la referencia de la zona.'),
  resumen: z.string().describe('Resumen de la evaluación en 2-3 oraciones, en español rioplatense.'),
  rangoEstimadoZona: z
    .string()
    .describe('Rango de precios estimado para un inmueble así en esa zona (ej: "$450.000 a $650.000").'),
  analisisPrecio: z
    .array(z.string())
    .describe('2 a 4 observaciones sobre si el precio es razonable según ambientes, m2, zona y estado del mercado.'),
  costoMensualEstimado: z
    .array(
      z.object({
        concepto: z.string().describe('Ej: Alquiler, Expensas, Servicios estimados, Seguro de caución.'),
        monto: z.string().describe('Monto en pesos con formato, o "A confirmar".'),
      }),
    )
    .describe('Desglose del costo mensual total aproximado de vivir en ese inmueble.'),
  puntosAFavor: z.array(z.string()).describe('Aspectos positivos del inmueble o la operación.'),
  puntosDeAtencion: z.array(z.string()).describe('Aspectos a revisar o que podrían jugar en contra del inquilino.'),
  checklistVisita: z
    .array(z.string())
    .describe('Cosas concretas para revisar durante la visita (humedad, presión de agua, aberturas, etc.).'),
  preguntasSugeridas: z
    .array(z.string())
    .describe('Preguntas para hacerle al propietario o inmobiliaria antes de avanzar.'),
  recomendacionFinal: z.string().describe('Recomendación final clara y accionable para el inquilino.'),
})

const referenciaZonas = zonas
  .map(
    (z) =>
      `- ${z.nombre} (${z.ciudad}): 2 ambientes ~ ${formatARS(z.precioPromedio)} ` +
      `(rango ${formatARS(z.precioMin)}–${formatARS(z.precioMax)}), var. interanual +${z.variacionAnual}%`,
  )
  .join('\n')

export async function POST(req: Request) {
  const { inmueble } = await req.json()

  if (!inmueble || typeof inmueble !== 'object') {
    return Response.json({ error: 'Faltan los datos del inmueble.' }, { status: 400 })
  }

  const {
    tipo,
    ambientes,
    superficie,
    barrio,
    ciudad,
    valorPedido,
    expensas,
    antiguedad,
    amoblado,
    caracteristicas,
  } = inmueble

  if (!valorPedido || Number(valorPedido) <= 0) {
    return Response.json({ error: 'Ingresá el valor de alquiler pedido para poder evaluarlo.' }, { status: 400 })
  }

  const descripcion = [
    `Tipo: ${tipo || 'No especificado'}`,
    `Ambientes: ${ambientes || 'No especificado'}`,
    `Superficie: ${superficie ? `${superficie} m²` : 'No especificada'}`,
    `Ubicación: ${[barrio, ciudad].filter(Boolean).join(', ') || 'No especificada'}`,
    `Alquiler pedido: ${formatARS(Number(valorPedido))} por mes`,
    `Expensas: ${expensas ? formatARS(Number(expensas)) : 'No especificadas'}`,
    `Antigüedad: ${antiguedad || 'No especificada'}`,
    `Amoblado: ${amoblado ? 'Sí' : 'No'}`,
    `Características: ${caracteristicas || 'No especificadas'}`,
  ].join('\n')

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4.1-mini',
      output: Output.object({ schema: evaluacionSchema }),
      system:
        'Sos un asesor inmobiliario que ayuda a inquilinos en Argentina a decidir si conviene alquilar un ' +
        'inmueble. Hablás en español rioplatense, claro y directo. Evaluás si el precio pedido es razonable ' +
        'según ambientes, superficie, zona y el estado actual del mercado, estimás el costo mensual total ' +
        '(alquiler + expensas + servicios), y das recomendaciones prácticas. No inventás datos exactos: si ' +
        'no tenés información precisa de la zona, aclaralo y usá rangos aproximados. El contexto es post ' +
        'DNU 70/2023, con alquileres de libre pacto y alta inflación.\n\n' +
        'PRECIOS DE REFERENCIA POR ZONA (valores orientativos para 2 ambientes, ajustá por tamaño y calidad):\n' +
        referenciaZonas,
      prompt:
        'Evaluá el siguiente inmueble para un inquilino y devolvé la evaluación estructurada. ' +
        'Si la zona no está en la lista de referencia, estimá con criterio de mercado y aclaralo.\n\n' +
        `DATOS DEL INMUEBLE:\n${descripcion}`,
    })

    return Response.json(output)
  } catch (err) {
    console.log('[v0] Error evaluando inmueble:', err instanceof Error ? err.message : err)
    return Response.json(
      {
        error:
          'No se pudo evaluar el inmueble. Verificá que el AI Gateway esté habilitado (tarjeta o AI_GATEWAY_API_KEY).',
      },
      { status: 500 },
    )
  }
}
