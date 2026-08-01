'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Requirements = { chainId: number; token: string; recipient: string; value: string; amount: string }

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
  }
}

function nonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export function DemoCheckoutForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function pay() {
    startTransition(async () => {
      setError('')
      try {
        if (!window.ethereum) throw new Error('Instalá una wallet compatible, como MetaMask, para pagar con USDC.')
        const requirementsRes = await fetch('/api/x402/activate-subscription')
        const requirements = (await requirementsRes.json()) as Requirements & { error?: string }
        if (!requirementsRes.ok) throw new Error(requirements.error)
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const account = Array.isArray(accounts) ? accounts[0] : null
        if (typeof account !== 'string') throw new Error('No se pudo conectar la wallet.')
        const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string
        if (chainId.toLowerCase() !== '0xa86a') {
          await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xa86a' }] })
        }
        const now = Math.floor(Date.now() / 1000)
        const authorization = { from: account, to: requirements.recipient, value: requirements.value, validAfter: now - 60, validBefore: now + 10 * 60, nonce: nonce() }
        const typedData = {
          domain: { name: 'USD Coin', version: '2', chainId: requirements.chainId, verifyingContract: requirements.token },
          primaryType: 'TransferWithAuthorization',
          types: {
            EIP712Domain: [{ name: 'name', type: 'string' }, { name: 'version', type: 'string' }, { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' }],
            TransferWithAuthorization: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }, { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' }],
          },
          message: { ...authorization, validAfter: String(authorization.validAfter), validBefore: String(authorization.validBefore) },
        }
        const signature = await window.ethereum.request({ method: 'eth_signTypedData_v4', params: [account, JSON.stringify(typedData)] })
        const paymentRes = await fetch('/api/x402/activate-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentPayload: { token: requirements.token, payload: { authorization, signature } }, paymentRequirements: { chainId: requirements.chainId } }),
        })
        const payment = (await paymentRes.json()) as { error?: string }
        if (!paymentRes.ok) throw new Error(payment.error)
        router.push('/inmobiliaria/upgrade/success')
        router.refresh()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo completar el pago.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">Pagás <strong className="text-foreground">20 USDC</strong> desde tu wallet en Avalanche. El acceso se activa por 30 días.</div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="button" size="lg" className="w-full" disabled={isPending} onClick={pay}>
        {isPending ? <><Loader2 className="size-4 animate-spin" />Procesando pago...</> : <><Wallet className="size-4" />Pagar 20 USDC</>}
      </Button>
    </div>
  )
}
