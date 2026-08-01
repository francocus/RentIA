import 'server-only'

export const X402_FACILITATOR_URL = 'https://x402.0xgasless.com'
export const X402_CHAIN_ID = 43114
export const X402_USDC_ADDRESS = '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
export const X402_PRICE = '20000000'
export const X402_PLAN_DAYS = 30

export function x402Recipient() {
  const recipient = process.env.X402_RECIPIENT_ADDRESS
  if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
    throw new Error('X402_RECIPIENT_ADDRESS no está configurada.')
  }
  return recipient
}
