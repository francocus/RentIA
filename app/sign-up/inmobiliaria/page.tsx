import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { InmobiliariaSignUpForm } from '@/components/inmobiliaria-signup-form'

export const metadata = {
  title: 'Crear cuenta inmobiliaria — RentIA',
  description: 'Registrate como inmobiliaria y accedé al analizador de postulantes con IA.',
}

export default async function InmobiliariaSignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/inmobiliaria')

  return <InmobiliariaSignUpForm />
}
