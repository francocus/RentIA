import { pgTable, text, timestamp, boolean, serial, jsonb, integer } from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  // 'inquilino' | 'inmobiliaria'
  role: text('role').notNull().default('inquilino'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ------------------------------------------------------------
// Análisis de contratos guardados por cada usuario.
// `userId` (sin FK) se usa para scopear cada query por usuario.

export const analyses = pgTable('analyses', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  titulo: text('titulo').notNull(),
  fechaContrato: text('fechaContrato'),
  regimen: text('regimen'),
  esPosteriorNuevaLey: boolean('esPosteriorNuevaLey'),
  resumen: text('resumen'),
  resultado: jsonb('resultado').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Suscripciones Stripe para cuentas inmobiliaria.
export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  stripeCustomerId: text('stripeCustomerId'),
  stripeSubscriptionId: text('stripeSubscriptionId'),
  stripePriceId: text('stripePriceId'),
  // 'inactive' | 'active' | 'past_due' | 'canceled'
  status: text('status').notNull().default('inactive'),
  currentPeriodEnd: timestamp('currentPeriodEnd'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

// Contratos escaneados por inquilinos — fuente de datos para inmobiliarias.
// Los campos de usuario están anonimizados (no se expone userId).
export const scannedContracts = pgTable('scanned_contracts', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  barrio: text('barrio'),
  zona: text('zona'),
  ambientes: integer('ambientes'),
  m2: integer('m2'),
  alquiler: integer('alquiler'),
  ajuste: text('ajuste'),
  plazo: text('plazo'),
  regimen: text('regimen'),
  fechaContrato: text('fechaContrato'),
  resumen: text('resumen'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Historial de análisis de postulantes guardados por inmobiliarias.
export const applicantAnalyses = pgTable('applicant_analyses', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  nombre: text('nombre').notNull(),
  dni: text('dni').notNull(),
  email: text('email'),
  telefono: text('telefono'),
  ingresos: text('ingresos'),
  tipoEmpleo: text('tipoEmpleo'),
  antiguedad: text('antiguedad'),
  documentos: jsonb('documentos').notNull().default([]),
  estado: text('estado').notNull(), // 'aprobado' | 'revisar' | 'rechazado'
  resumen: text('resumen'),
  observaciones: text('observaciones'),
  recomendacion: text('recomendacion'),
  documentosRecibidos: jsonb('documentosRecibidos').notNull().default([]),
  ingresoDetectado: text('ingresoDetectado'),
  antiguedadLaboral: text('antiguedadLaboral'),
  verificacionLegal: jsonb('verificacionLegal'),
  resultado: jsonb('resultado').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// Contratos de referencia de mercado. El comparador calcula promedio/min/max
// por zona directamente desde esta tabla (datos sembrados).
export const marketListings = pgTable('market_listings', {
  id: serial('id').primaryKey(),
  zonaId: text('zonaId').notNull(),
  zona: text('zona').notNull(),
  ciudad: text('ciudad').notNull(),
  ambientes: integer('ambientes').notNull(),
  m2: integer('m2').notNull(),
  alquiler: integer('alquiler').notNull(),
  fecha: text('fecha').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
