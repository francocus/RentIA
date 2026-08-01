'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { activateDemoSubscription } from '@/app/actions/stripe'

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

export function DemoCheckoutForm() {
  const router = useRouter()
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await activateDemoSubscription()
      router.push('/inmobiliaria')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Nombre en la tarjeta */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-name">Nombre en la tarjeta</Label>
        <Input
          id="card-name"
          placeholder="Juan García"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="cc-name"
          disabled={isPending}
        />
      </div>

      {/* Número de tarjeta */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-number">Número de tarjeta</Label>
        <div className="relative">
          <Input
            id="card-number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            inputMode="numeric"
            autoComplete="cc-number"
            disabled={isPending}
            className="pr-10"
          />
          <CreditCard
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Vencimiento + CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="card-expiry">Vencimiento</Label>
          <Input
            id="card-expiry"
            placeholder="MM/AA"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            inputMode="numeric"
            autoComplete="cc-exp"
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="card-cvv">CVV</Label>
          <Input
            id="card-cvv"
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            autoComplete="cc-csc"
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Activando plan...
          </>
        ) : (
          'Activar plan — 7 días gratis'
        )}
      </Button>
    </form>
  )
}
