// Datos de referencia para el MVP de RentIA.
// NOTA: valores ilustrativos para la demo. En producción se conectan a
// fuentes reales (BCRA para el ICL, portales inmobiliarios para precios).

export type Zona = {
  id: string
  nombre: string
  ciudad: string
  // precio de referencia por ambiente (2 ambientes) en ARS
  precioPromedio: number
  precioMin: number
  precioMax: number
  // variación interanual del alquiler en la zona (%)
  variacionAnual: number
}

export const zonas: Zona[] = [
  { id: 'palermo', nombre: 'Palermo', ciudad: 'CABA', precioPromedio: 620000, precioMin: 480000, precioMax: 820000, variacionAnual: 92 },
  { id: 'caballito', nombre: 'Caballito', ciudad: 'CABA', precioPromedio: 510000, precioMin: 410000, precioMax: 660000, variacionAnual: 88 },
  { id: 'belgrano', nombre: 'Belgrano', ciudad: 'CABA', precioPromedio: 590000, precioMin: 470000, precioMax: 780000, variacionAnual: 90 },
  { id: 'villa-urquiza', nombre: 'Villa Urquiza', ciudad: 'CABA', precioPromedio: 470000, precioMin: 380000, precioMax: 600000, variacionAnual: 86 },
  { id: 'la-plata-centro', nombre: 'La Plata Centro', ciudad: 'Buenos Aires', precioPromedio: 340000, precioMin: 260000, precioMax: 450000, variacionAnual: 79 },
  { id: 'rosario-centro', nombre: 'Rosario Centro', ciudad: 'Santa Fe', precioPromedio: 360000, precioMin: 280000, precioMax: 470000, variacionAnual: 81 },
  { id: 'cordoba-nueva-cordoba', nombre: 'Nueva Córdoba', ciudad: 'Córdoba', precioPromedio: 330000, precioMin: 250000, precioMax: 440000, variacionAnual: 83 },
  { id: 'mendoza-centro', nombre: 'Mendoza Centro', ciudad: 'Mendoza', precioPromedio: 310000, precioMin: 240000, precioMax: 420000, variacionAnual: 77 },
]

// Índices de actualización disponibles y su tasa mensual estimada (%).
// El ICL (Índice de Contratos de Locación, BCRA) combina inflación y salarios.
export type Indice = {
  id: string
  nombre: string
  descripcion: string
  // tasa mensual estimada usada para proyectar (%)
  tasaMensualEstimada: number
}

export const indices: Indice[] = [
  {
    id: 'icl',
    nombre: 'ICL (BCRA)',
    descripcion: 'Índice de Contratos de Locación. Combina inflación (IPC) y salarios (RIPTE).',
    tasaMensualEstimada: 3.8,
  },
  {
    id: 'ipc',
    nombre: 'IPC (INDEC)',
    descripcion: 'Índice de Precios al Consumidor. Refleja la inflación general.',
    tasaMensualEstimada: 3.5,
  },
  {
    id: 'casa-propia',
    nombre: 'Casa Propia',
    descripcion: 'Coeficiente que toma el menor entre inflación y salarios.',
    tasaMensualEstimada: 3.2,
  },
  {
    id: 'libre',
    nombre: 'Acuerdo libre',
    descripcion: 'Porcentaje pactado libremente entre las partes (post DNU 70/2023).',
    tasaMensualEstimada: 4.0,
  },
]

export function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export function formatPct(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

export type ProyeccionPunto = {
  mes: number
  etiqueta: string
  alquiler: number
  acumulado: number
}

/**
 * Proyecta el valor del alquiler mes a mes aplicando el ajuste con la
 * frecuencia indicada (en meses). Entre ajustes el valor se mantiene fijo.
 */
export function proyectarAlquiler(params: {
  montoInicial: number
  tasaMensual: number
  frecuenciaAjusteMeses: number
  duracionMeses: number
}): ProyeccionPunto[] {
  const { montoInicial, tasaMensual, frecuenciaAjusteMeses, duracionMeses } = params
  const puntos: ProyeccionPunto[] = []
  let actual = montoInicial
  const tasa = tasaMensual / 100

  for (let mes = 0; mes <= duracionMeses; mes++) {
    if (mes > 0 && frecuenciaAjusteMeses > 0 && mes % frecuenciaAjusteMeses === 0) {
      // aplica el ajuste acumulado del período transcurrido
      actual = actual * Math.pow(1 + tasa, frecuenciaAjusteMeses)
    }
    puntos.push({
      mes,
      etiqueta: `Mes ${mes}`,
      alquiler: Math.round(actual),
      acumulado: Math.round(actual - montoInicial),
    })
  }
  return puntos
}
