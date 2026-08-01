import Link from 'next/link'
import { Lock } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function AccountRequired({
  titulo,
  descripcion,
  redirect,
}: {
  titulo: string
  descripcion: string
  redirect: string
}) {
  const next = encodeURIComponent(redirect)
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground text-balance">{titulo}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">
            {descripcion}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/sign-up?next=${next}`} className={buttonVariants()}>
            Crear cuenta gratis
          </Link>
          <Link href={`/sign-in?next=${next}`} className={buttonVariants({ variant: 'outline' })}>
            Ya tengo cuenta
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
