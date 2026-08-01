'use client'

import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { History, LogOut } from 'lucide-react'

export function UserMenu({ user }: { user: { name?: string | null; email: string } | null }) {
  const router = useRouter()

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/sign-in')}>
          Ingresar
        </Button>
        <Button size="sm" onClick={() => router.push('/sign-up')}>
          Crear cuenta
        </Button>
      </div>
    )
  }

  async function signOut() {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => router.push('/historial')}>
        <History className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Mis análisis</span>
      </Button>
      <div className="hidden items-center gap-2 md:flex">
        <span className="max-w-[140px] truncate text-sm text-muted-foreground" title={user.email}>
          {user.name || user.email}
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={signOut}>
        <LogOut className="size-4" aria-hidden="true" />
        <span className="sr-only">Cerrar sesión</span>
      </Button>
    </div>
  )
}
