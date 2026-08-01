'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Building2, Check } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

const beneficios = [
  'Analizá postulantes en segundos con IA',
  'Detectá documentación faltante automáticamente',
  'Informes con observaciones y recomendaciones',
  'Acceso ilimitado durante la suscripción activa',
]

export function InmobiliariaSignUpForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.isComposing) return
    setError(null)
    setLoading(true)

    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
      // Guardamos el rol desde el registro para que Better Auth lo persista
      fetchOptions: undefined,
    } as Parameters<typeof authClient.signUp.email>[0])

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Ocurrió un error. Intentá de nuevo.')
      return
    }

    // Después del registro, ir al checkout para activar la suscripción
    router.push('/inmobiliaria/upgrade')
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-start justify-center bg-background px-4 py-12">
      <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-2">
        {/* Info del plan */}
        <div className="flex flex-col justify-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary self-start">
            <Building2 className="size-3.5" aria-hidden="true" />
            Plan Inmobiliaria
          </div>
          <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground">
            Automatizá el análisis de postulantes
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
            Creá tu cuenta y empezá con 7 días gratis. Cancelá cuando quieras desde el panel de tu
            cuenta.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {beneficios.map((b) => (
              <div key={b} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{b}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card p-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-foreground">$9.900</span>
              <span className="text-sm text-muted-foreground">ARS / mes</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Primeros 7 días gratis. Luego se cobra mensualmente.
            </p>
          </div>
        </div>

        {/* Formulario */}
        <Card className="p-6">
          <div className="mb-6">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">RentIA</span>
            </Link>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Crear cuenta inmobiliaria
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Después del registro te llevamos al checkout de Stripe para activar tu plan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre o razón social</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Inmobiliaria Ejemplo S.A."
                required
                autoComplete="organization"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando cuenta...' : 'Continuar al pago'}
              {!loading && <ArrowRight className="size-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {'¿Ya tenés cuenta? '}
            <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
              Ingresá
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {'¿Sos inquilino? '}
            <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
              Creá una cuenta gratis
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}
