// Marco normativo de la locación de vivienda en Argentina.
// Se usa como referencia para el análisis con IA y para detectar el régimen
// aplicable según la fecha de celebración del contrato.

export type RegimenId = 'anterior' | 'ley-27551' | 'ley-27737' | 'dnu-70-2023'

export type Regimen = {
  id: RegimenId
  nombre: string
  vigenciaDesde: string // YYYY-MM-DD (inclusive)
  vigenciaHasta: string | null // YYYY-MM-DD (inclusive) o null si sigue vigente
  plazoMinimo: string
  ajuste: string
  indice: string
  resumen: string
}

// Línea de tiempo de los regímenes según la fecha de FIRMA del contrato.
export const REGIMENES: Regimen[] = [
  {
    id: 'anterior',
    nombre: 'Régimen anterior (Ley 23.091 + Código Civil y Comercial)',
    vigenciaDesde: '1900-01-01',
    vigenciaHasta: '2020-06-30',
    plazoMinimo: '2 años para vivienda.',
    ajuste: 'Aumentos escalonados pactados entre las partes (habitualmente semestrales).',
    indice: 'Sin índice obligatorio; porcentajes fijos pactados.',
    resumen:
      'Contratos previos a la primera Ley de Alquileres. Plazo mínimo de 2 años y aumentos ' +
      'escalonados de libre pacto. La indexación estaba en general prohibida (Ley 23.928).',
  },
  {
    id: 'ley-27551',
    nombre: 'Ley 27.551 (primera Ley de Alquileres)',
    vigenciaDesde: '2020-07-01',
    vigenciaHasta: '2023-10-17',
    plazoMinimo: '3 años para vivienda.',
    ajuste: 'Un único ajuste ANUAL (cada 12 meses).',
    indice:
      'Obligatorio el ICL (Índice para Contratos de Locación) del BCRA, que promedia inflación (IPC) y salarios (RIPTE).',
    resumen:
      'Amplió el plazo mínimo a 3 años y estableció ajustes anuales mediante el ICL del BCRA. ' +
      'También reguló depósito en garantía (un mes) y registro de contratos ante AFIP.',
  },
  {
    id: 'ley-27737',
    nombre: 'Ley 27.737 (reforma de octubre 2023)',
    vigenciaDesde: '2023-10-18',
    vigenciaHasta: '2023-12-28',
    plazoMinimo: '3 años para vivienda.',
    ajuste: 'Ajuste SEMESTRAL (cada 6 meses).',
    indice:
      'Coeficiente "Casa Propia" (menor entre variación salarial e inflación), en lugar del ICL.',
    resumen:
      'Reforma breve que redujo la frecuencia de ajuste a semestral y cambió el índice al ' +
      'coeficiente Casa Propia. Estuvo vigente pocas semanas antes del DNU 70/2023.',
  },
  {
    id: 'dnu-70-2023',
    nombre: 'DNU 70/2023 (desregulación) y Código Civil y Comercial',
    vigenciaDesde: '2023-12-29',
    vigenciaHasta: null,
    plazoMinimo: 'Libre acuerdo entre las partes (sin mínimo legal específico).',
    ajuste: 'Frecuencia de actualización de libre pacto (mensual, trimestral, etc.).',
    indice:
      'Índice de libre elección (ICL, IPC, CER, UVA, dólar, etc.). No hay índice obligatorio.',
    resumen:
      'El DNU 70/2023 derogó la Ley de Alquileres. Los contratos nuevos se rigen por el Código ' +
      'Civil y Comercial con amplia libertad: plazo, moneda, índice y frecuencia de ajuste se ' +
      'pactan libremente entre las partes.',
  },
]

/** Devuelve el régimen aplicable a un contrato firmado en la fecha dada. */
export function regimenPorFecha(fecha: string): Regimen | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null
  for (const r of REGIMENES) {
    const desdeOk = fecha >= r.vigenciaDesde
    const hastaOk = r.vigenciaHasta === null || fecha <= r.vigenciaHasta
    if (desdeOk && hastaOk) return r
  }
  return null
}

/** Texto de referencia legal compacto para inyectar en el prompt de la IA. */
export function marcoLegalParaPrompt(): string {
  return REGIMENES.map(
    (r) =>
      `- ${r.nombre} [vigencia: ${r.vigenciaDesde} a ${r.vigenciaHasta ?? 'actualidad'}]. ` +
      `Plazo mínimo: ${r.plazoMinimo} Ajuste: ${r.ajuste} Índice: ${r.indice}`,
  ).join('\n')
}
