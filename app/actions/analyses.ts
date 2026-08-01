'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { analyses } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

type ResultadoAnalisis = {
  resumen?: string
  regimenAplicable?: string
  esPosteriorNuevaLey?: boolean
  [key: string]: unknown
}

export async function saveAnalysis(input: {
  titulo: string
  fechaContrato: string | null
  resultado: ResultadoAnalisis
}) {
  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return { error: 'Tenés que iniciar sesión para guardar análisis.' }
  }

  const titulo = input.titulo.trim().slice(0, 120) || 'Análisis sin título'

  await db.insert(analyses).values({
    userId,
    titulo,
    fechaContrato: input.fechaContrato,
    regimen: input.resultado.regimenAplicable ?? null,
    esPosteriorNuevaLey: input.resultado.esPosteriorNuevaLey ?? null,
    resumen: input.resultado.resumen ?? null,
    resultado: input.resultado,
  })

  revalidatePath('/historial')
  return { ok: true }
}

export async function getAnalyses() {
  const userId = await getUserId()
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt))
}

export async function deleteAnalysis(id: number) {
  const userId = await getUserId()
  await db.delete(analyses).where(and(eq(analyses.id, id), eq(analyses.userId, userId)))
  revalidatePath('/historial')
}
