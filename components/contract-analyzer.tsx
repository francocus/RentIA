'use client'

import { FileText, Home } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContractTab } from '@/components/analyzer/contract-tab'
import { PropertyTab } from '@/components/analyzer/property-tab'

export function ContractAnalyzer({ isAuthed = false }: { isAuthed?: boolean }) {
  return (
    <section id="contrato" className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Analizá con IA antes de firmar</h2>
        <p className="mt-1 text-pretty text-muted-foreground">
          ¿Ya tenés el contrato? Subilo, escanealo o pegalo y la IA detecta la ley que lo rige y sus riesgos.
          ¿Todavía estás buscando? Cargá los datos del inmueble y evaluamos si conviene.
        </p>
      </div>

      <Tabs defaultValue="contrato" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="contrato">
            <FileText className="size-4" aria-hidden="true" />
            Tengo contrato
          </TabsTrigger>
          <TabsTrigger value="inmueble">
            <Home className="size-4" aria-hidden="true" />
            Estoy buscando
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contrato">
          <ContractTab isAuthed={isAuthed} />
        </TabsContent>
        <TabsContent value="inmueble">
          <PropertyTab isAuthed={isAuthed} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
