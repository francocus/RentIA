import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { AuthForm } from '@/components/auth-form'

function safeNext(next?: string) {
  return next && next.startsWith('/') ? next : '/'
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const dest = safeNext(next)
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(dest)
  return <AuthForm mode="sign-in" next={dest} />
}
