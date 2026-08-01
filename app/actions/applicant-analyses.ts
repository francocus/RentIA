'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { applicantAnalyses } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('No autorizado')
  return session.user.id
}

export async function getApplicantAnalyses() {
  const userId = await getUserId()
  return db
    .select()
    .from(applicantAnalyses)
    .where(eq(applicantAnalyses.userId, userId))
    .orderBy(desc(applicantAnalyses.createdAt))
}

export async function getApplicantAnalysisById(id: number) {
  const userId = await getUserId()
  const [row] = await db
    .select()
    .from(applicantAnalyses)
    .where(and(eq(applicantAnalyses.id, id), eq(applicantAnalyses.userId, userId)))
  return row ?? null
}

export async function deleteApplicantAnalysis(id: number) {
  const userId = await getUserId()
  await db
    .delete(applicantAnalyses)
    .where(and(eq(applicantAnalyses.id, id), eq(applicantAnalyses.userId, userId)))
  revalidatePath('/inmobiliaria/historial')
}
