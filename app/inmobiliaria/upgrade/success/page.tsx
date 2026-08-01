import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function UpgradeSuccessPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-foreground">
          Suscripción activada
        </h1>
        <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
          Tu plan Inmobiliaria está activo. Ya podés analizar postulantes con IA.
        </p>
        <Link
          href="/inmobiliaria"
          className={buttonVariants({ size: 'lg', className: 'mt-8' })}
        >
          Ir a Inmobiliaria
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          Si el acceso no se activó todavía, esperá unos segundos y recargá la página.
        </p>
      </div>
    </main>
  )
}
