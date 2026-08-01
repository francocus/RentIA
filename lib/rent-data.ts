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

// Barrios y zonas de la ciudad de Rosario, Santa Fe.
export const zonas: Zona[] = [
  { id: 'centro', nombre: 'Centro', ciudad: 'Rosario', precioPromedio: 360000, precioMin: 280000, precioMax: 470000, variacionAnual: 81 },
  { id: 'pichincha', nombre: 'Pichincha', ciudad: 'Rosario', precioPromedio: 400000, precioMin: 320000, precioMax: 520000, variacionAnual: 84 },
  { id: 'puerto-norte', nombre: 'Puerto Norte', ciudad: 'Rosario', precioPromedio: 520000, precioMin: 420000, precioMax: 700000, variacionAnual: 88 },
  { id: 'echesortu', nombre: 'Echesortu', ciudad: 'Rosario', precioPromedio: 320000, precioMin: 250000, precioMax: 410000, variacionAnual: 79 },
  { id: 'abasto', nombre: 'Abasto', ciudad: 'Rosario', precioPromedio: 310000, precioMin: 240000, precioMax: 400000, variacionAnual: 78 },
  { id: 'fisherton', nombre: 'Fisherton', ciudad: 'Rosario', precioPromedio: 430000, precioMin: 340000, precioMax: 580000, variacionAnual: 82 },
  { id: 'lourdes', nombre: 'Lourdes', ciudad: 'Rosario', precioPromedio: 350000, precioMin: 270000, precioMax: 450000, variacionAnual: 80 },
  { id: 'martin', nombre: 'Barrio Martin', ciudad: 'Rosario', precioPromedio: 450000, precioMin: 360000, precioMax: 600000, variacionAnual: 85 },
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
