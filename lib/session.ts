import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

/** Usuario de la sesión actual, o null. Para Server Components y páginas. */
export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

/** Igual que getSessionUser, pensado para Route Handlers (reciben el Request). */
export async function getSessionUserFromRequest(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers })
  return session?.user ?? null
}
