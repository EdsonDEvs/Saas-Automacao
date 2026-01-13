"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ensureUserProfile } from "@/lib/supabase/ensure-profile"
import { Copy, RefreshCw, Loader2, Check, Download, FileJson } from "lucide-react"

type ApiKey = {
  id: string
  key: string
  is_active: boolean
}

export default function IntegrationPage() {
  const [apiKey, setApiKey] = useState<ApiKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadApiKey()
  }, [])

  const loadApiKey = async () => {
    try {
      // Garante que o perfil existe
      await ensureUserProfile()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (error && error.code !== "PGRST116") throw error
      setApiKey(data)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar API key",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!apiKey) return

    try {
      await navigator.clipboard.writeText(apiKey.key)
      setCopied(true)
      toast({
        title: "Copiado!",
        description: "API Key copiada para a área de transferência.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar API key",
        variant: "destructive",
      })
    }
  }

  const handleRegenerate = async () => {
    if (!confirm("Tem certeza que deseja regenerar a API Key? A chave atual será desativada.")) return

    setRegenerating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Deactivate old key
      if (apiKey) {
        await supabase
          .from("api_keys")
          .update({ is_active: false })
          .eq("id", apiKey.id)
      }

      // Create new key
      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Sucesso!",
        description: "Nova API Key gerada com sucesso.",
      })
      loadApiKey()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao regenerar API key",
        variant: "destructive",
      })
    } finally {
      setRegenerating(false)
    }
  }

  const getEndpointUrl = () => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/api/v1/context`
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
        <h1 className="text-3xl font-bold">Integração API</h1>
        <p className="text-muted-foreground">
          Configure sua integração com n8n, Typebot ou outras ferramentas
        </p>
      </div>

      <div className="space-y-6">
        <Card>
            <CardHeader>
              <CardTitle>API Key</CardTitle>
              <CardDescription>
                Use esta chave para autenticar suas requisições
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKey ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-md bg-muted p-3 font-mono text-sm break-all">
                      {apiKey.key}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerar Chave
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Nenhuma API Key ativa encontrada.
                </p>
              )}
            </CardContent>
          </Card>

        <Card>
            <CardHeader>
              <CardTitle>Endpoint URL</CardTitle>
              <CardDescription>
                URL para usar nas suas integrações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md bg-muted p-3 font-mono text-sm break-all">
                  {getEndpointUrl()}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    await navigator.clipboard.writeText(getEndpointUrl())
                    toast({
                      title: "Copiado!",
                      description: "URL copiada para a área de transferência.",
                    })
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

        <Card>
            <CardHeader>
              <CardTitle>Documentação</CardTitle>
              <CardDescription>
                Como usar a API em suas integrações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Método: GET</h4>
                <p className="text-sm text-muted-foreground">
                  Faça uma requisição GET para o endpoint acima.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Headers:</h4>
                <div className="rounded-md bg-muted p-3 font-mono text-sm">
                  <div>x-api-key: {apiKey?.key || "sua-api-key"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Resposta:</h4>
                <div className="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "agent": {
    "name": "Nome do Agente",
    "persona": "Instruções do sistema...",
    "tone": "Friendly"
  },
  "context": "Regras de negócio...",
  "inventory_text": "- Produto 1 (R$ 100): Descrição...\\n- Produto 2 (R$ 200): Descrição..."
}`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Exemplo (cURL):</h4>
                <div className="rounded-md bg-muted p-3 font-mono text-sm overflow-x-auto">
                  <pre>{`curl -X GET "${getEndpointUrl()}" \\
  -H "x-api-key: ${apiKey?.key || "sua-api-key"}"`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Exemplo (n8n):</h4>
                <p className="text-sm text-muted-foreground">
                  1. Adicione um nó HTTP Request
                  <br />
                  2. Configure o método como GET
                  <br />
                  3. Cole a URL do endpoint
                  <br />
                  4. Adicione o header: <code className="bg-muted px-1 rounded">x-api-key</code> com sua API key
                  <br />
                  5. Use a resposta JSON no seu fluxo
                </p>
              </div>
            </CardContent>
          </Card>

        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Templates n8n Prontos
              </CardTitle>
              <CardDescription>
                Baixe fluxos prontos para usar no n8n - basta importar e configurar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">Fluxo Simples Genérico ⭐</h4>
                      <p className="text-sm text-muted-foreground">
                        Template básico que funciona com qualquer plataforma (recomendado para começar)
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      window.open('/n8n-templates/fluxo-simples-generico.json', '_blank')
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">Fluxo Básico WhatsApp</h4>
                      <p className="text-sm text-muted-foreground">
                        Integração simples com WhatsApp usando webhook
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open('/n8n-templates/fluxo-basico-whatsapp.json', '_blank')
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">Fluxo Completo Telegram</h4>
                      <p className="text-sm text-muted-foreground">
                        Fluxo completo com comandos e tratamento de mensagens
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open('/n8n-templates/fluxo-completo-telegram.json', '_blank')
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Como usar os templates:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Baixe o template desejado</li>
                  <li>No n8n, vá em <strong>Workflows</strong> → <strong>Import</strong></li>
                  <li>Selecione o arquivo JSON baixado</li>
                  <li>Configure as variáveis de ambiente:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code>API_ENDPOINT</code> = {getEndpointUrl()}</li>
                      <li><code>API_KEY</code> = {apiKey?.key || "sua-api-key"}</li>
                    </ul>
                  </li>
                  <li>Configure as credenciais (WhatsApp, Telegram, OpenAI)</li>
                  <li>Ative o workflow e teste!</li>
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">
                  💡 Dica: Os templates já estão pré-configurados para buscar automaticamente o contexto do seu agente e produtos!
                </p>
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
