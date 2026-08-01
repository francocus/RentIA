import { createMCPClient, type MCPClient } from '@ai-sdk/mcp'
import type { ToolSet } from 'ai'

// Servidor MCP que expone la base oficial de InfoLEG (Ministerio de Justicia,
// datos.jus.gob.ar): búsqueda de normas nacionales, texto vigente y modificaciones.
const LEGAL_MCP_URL = 'https://mcp.derechointeligente.com.ar/mcp'

// Solo exponemos a la IA las herramientas de legislación relevantes para
// analizar contratos de alquiler (no las de dólar, feriados, AFIP, etc.).
const HERRAMIENTAS_LEGALES = [
  'infoleg_buscar_normas',
  'infoleg_resolver_id',
  'infoleg_ver_norma',
  'infoleg_obtener_texto_actualizado',
  'infoleg_ver_normas_que_la_modifican',
]

export type LegalToolsConnection = {
  client: MCPClient
  tools: ToolSet
}

/**
 * Conecta al servidor MCP de legislación argentina y devuelve las herramientas
 * de InfoLEG listas para pasarle a `generateText`. Si la conexión falla,
 * devuelve null para que el análisis siga funcionando sin fuentes externas.
 * El llamador debe cerrar `client` al terminar.
 */
export async function conectarFuentesLegales(): Promise<LegalToolsConnection | null> {
  try {
    const client = await createMCPClient({
      transport: { type: 'http', url: LEGAL_MCP_URL },
    })

    const todas = await client.tools()
    const tools: ToolSet = Object.fromEntries(
      Object.entries(todas).filter(([nombre]) => HERRAMIENTAS_LEGALES.includes(nombre)),
    )

    return { client, tools }
  } catch (err) {
    console.log(
      '[v0] No se pudo conectar a la fuente legal (InfoLEG MCP), se analiza sin ella:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}
