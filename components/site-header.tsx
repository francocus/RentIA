import Link from 'next/link'
import { Home } from 'lucide-react'
import { UserMenu } from '@/components/user-menu'
import { cn } from '@/lib/utils'

type NavKey = 'contrato' | 'condiciones' | 'precios' | 'simulador' | 'inmobiliaria'

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'contrato', label: 'Revisar contrato', href: '/contrato' },
  { key: 'condiciones', label: 'Evaluar condiciones', href: '/condiciones' },
  { key: 'precios', label: 'Precios por zona', href: '/precios' },
  { key: 'simulador', label: 'Simulador', href: '/simulador' },
  { key: 'inmobiliaria', label: 'Inmobiliaria', href: '/inmobiliaria' },
]

export function SiteHeader({
  user,
  active,
}: {
  user?: { name?: string | null; email: string } | null
  active?: NavKey
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="size-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Rent<span className="text-primary">IA</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? 'page' : undefined}
              className={cn(
                'transition-colors hover:text-foreground',
                active === item.key && 'text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <UserMenu user={user ?? null} />
      </div>
    </header>
  )
}
