"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ensureUserProfile } from "@/lib/supabase/ensure-profile"
import { Loader2 } from "lucide-react"

type AgentConfig = {
  id: string
  user_id: string
  agent_name: string
  system_prompt: string
  tone: "Formal" | "Friendly" | "Sales"
  is_active: boolean
  service_catalog?: { name: string; duration_minutes: number }[]
}

export default function AgentPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<AgentConfig | null>(null)
  const [agentName, setAgentName] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [tone, setTone] = useState<"Formal" | "Friendly" | "Sales">("Friendly")
  const [isActive, setIsActive] = useState(true)
  const [serviceCatalog, setServiceCatalog] = useState<
    { name: string; duration_minutes: number }[]
  >([])
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      // Garante que o perfil existe
      await ensureUserProfile()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("agent_configs")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setConfig(data)
        setAgentName(data.agent_name)
        setSystemPrompt(data.system_prompt)
        setTone(data.tone)
        setIsActive(data.is_active)
        // Tenta carregar service_catalog, mas não falha se não existir
        setServiceCatalog(data.service_catalog || [])
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar configurações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Prepara os dados para atualização/inserção
      const updateData: any = {
        agent_name: agentName,
        system_prompt: systemPrompt,
        tone,
        is_active: isActive,
      }

      // Só inclui service_catalog se a coluna existir (evita erro se migration não foi aplicada)
      // O Supabase vai ignorar campos que não existem na tabela
      try {
        updateData.service_catalog = serviceCatalog
      } catch (e) {
        // Se houver erro, continua sem service_catalog
        console.warn("service_catalog não disponível, continuando sem ele")
      }

      if (config) {
        // Update existing
        const { error } = await supabase
          .from("agent_configs")
          .update(updateData)
          .eq("id", config.id)

        if (error) {
          // Se o erro for sobre service_catalog não existir, tenta novamente sem ele
          if (error.message?.includes("service_catalog") || error.message?.includes("schema cache")) {
            const { service_catalog, ...dataWithoutCatalog } = updateData
            const { error: retryError } = await supabase
              .from("agent_configs")
              .update(dataWithoutCatalog)
              .eq("id", config.id)
            
            if (retryError) throw retryError
            
            toast({
              title: "Aviso",
              description: "Configurações salvas, mas service_catalog não está disponível. Aplique a migration 005 no Supabase.",
              variant: "default",
            })
          } else {
            throw error
          }
        }
      } else {
        // Create new
        const { error } = await supabase
          .from("agent_configs")
          .insert({
            user_id: user.id,
            ...updateData,
          })

        if (error) {
          // Se o erro for sobre service_catalog não existir, tenta novamente sem ele
          if (error.message?.includes("service_catalog") || error.message?.includes("schema cache")) {
            const { service_catalog, ...dataWithoutCatalog } = updateData
            const { error: retryError } = await supabase
              .from("agent_configs")
              .insert({
                user_id: user.id,
                ...dataWithoutCatalog,
              })
            
            if (retryError) throw retryError
            
            toast({
              title: "Aviso",
              description: "Configurações salvas, mas service_catalog não está disponível. Aplique a migration 005 no Supabase.",
              variant: "default",
            })
          } else {
            throw error
          }
        }
      }

      toast({
        title: "Sucesso!",
        description: "Configurações do agente salvas com sucesso.",
      })
      loadConfig()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configurações",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
          <h1 className="text-3xl font-bold">Configuração do Agente IA</h1>
          <p className="text-muted-foreground">
            Defina a persona e comportamento do seu agente
          </p>
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Persona do Agente</CardTitle>
            <CardDescription>
              Configure como seu agente se comporta e responde aos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agentName">Nome do Agente</Label>
                <Input
                  id="agentName"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Julia, Assistente Virtual"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tom de Voz</Label>
                <Select value={tone} onValueChange={(value: "Formal" | "Friendly" | "Sales") => setTone(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Formal">Formal</SelectItem>
                    <SelectItem value="Friendly">Amigável</SelectItem>
                    <SelectItem value="Sales">Vendas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Regras de Negócio / Contexto</Label>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Ex: Você é um assistente virtual da empresa XYZ. Sempre seja educado e prestativo. Quando o cliente perguntar sobre serviços, forneça informações detalhadas..."
                  rows={10}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Descreva as regras de negócio, contexto da empresa e instruções específicas para o agente.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Serviços e Durações</Label>
                <p className="text-sm text-muted-foreground">
                  Informe os serviços disponíveis e a duração média de cada um. A IA usa isso para reservar o tempo correto.
                </p>
                <div className="space-y-3">
                  {serviceCatalog.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum serviço cadastrado. Adicione pelo menos um para melhorar os agendamentos.
                    </p>
                  )}
                  {serviceCatalog.map((service, index) => (
                    <div key={`${service.name}-${index}`} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Input
                        value={service.name}
                        placeholder="Ex: Corte de cabelo"
                        onChange={(e) => {
                          const updated = [...serviceCatalog]
                          updated[index] = { ...service, name: e.target.value }
                          setServiceCatalog(updated)
                        }}
                      />
                      <Input
                        type="number"
                        min={5}
                        value={service.duration_minutes}
                        placeholder="Duração (min)"
                        onChange={(e) => {
                          const updated = [...serviceCatalog]
                          updated[index] = {
                            ...service,
                            duration_minutes: parseInt(e.target.value || "0", 10),
                          }
                          setServiceCatalog(updated)
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const updated = serviceCatalog.filter((_, idx) => idx !== index)
                          setServiceCatalog(updated)
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setServiceCatalog([
                      ...serviceCatalog,
                      { name: "", duration_minutes: 60 },
                    ])
                  }
                >
                  Adicionar serviço
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Agente ativo
                </Label>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Configurações"
                )}
              </Button>
            </form>
          </CardContent>
      </Card>
    </div>
  )
}
