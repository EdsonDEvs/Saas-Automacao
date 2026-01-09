"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ensureUserProfile } from "@/lib/supabase/ensure-profile"
import { Loader2, Send, CheckCircle2, XCircle, AlertCircle, ExternalLink, Settings } from "lucide-react"

export default function DebugPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testMessage, setTestMessage] = useState("teste")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [testUrl, setTestUrl] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    // Só define URLs no cliente para evitar erro de hidratação
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhook/whatsapp`)
      setTestUrl(`${window.location.origin}/api/webhook/test`)
    }
  }, [])

  const testWebhook = async () => {
    setTesting(true)
    setResult(null)

    try {
      await ensureUserProfile()
      
      // Verifica autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setResult({
          success: false,
          error: `Erro de autenticação: ${authError?.message || "Usuário não encontrado"}`,
        })
        router.push("/login")
        return
      }

      // Busca integração com tratamento de erro melhorado
      const { data: integration, error: integrationError } = await supabase
        .from("integrations")
        .select("webhook_url, api_key, instance_name")
        .eq("user_id", user.id)
        .eq("platform", "whatsapp")
        .eq("is_active", true)
        .maybeSingle()

      if (integrationError) {
        console.error("Erro ao buscar integração:", integrationError)
        
        // Verifica se é erro de tabela não encontrada
        const isTableNotFound = integrationError.message?.includes("does not exist") || 
                                integrationError.code === "PGRST116" ||
                                integrationError.message?.includes("relation") ||
                                integrationError.message?.includes("406")
        
        setResult({
          success: false,
          error: isTableNotFound 
            ? "Tabela 'integrations' não encontrada. Execute a migração 002_integrations.sql no Supabase SQL Editor."
            : `Erro ao buscar integração: ${integrationError.message || integrationError.code || "Erro desconhecido"}`,
          details: {
            code: integrationError.code,
            message: integrationError.message,
            hint: integrationError.hint,
          },
        })
        return
      }

      if (!integration) {
        setResult({
          success: false,
          error: "Nenhuma integração WhatsApp ativa encontrada. Configure uma integração em /setup primeiro.",
        })
        return
      }

      // Simula mensagem da Evolution API
      const testPayload = {
        text: {
          body: testMessage,
        },
        key: {
          remoteJid: "5511999999999@s.whatsapp.net",
        },
        instance: integration.instance_name,
      }

      const response = await fetch("/api/webhook/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      })

      const data = await response.json()
      setResult({
        success: response.ok,
        status: response.status,
        data: data,
        payload: testPayload,
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      })
    } finally {
      setTesting(false)
    }
  }

  const checkWebhookConfig = async () => {
    try {
      await ensureUserProfile()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast({
          title: "Erro",
          description: `Erro de autenticação: ${authError?.message || "Usuário não encontrado"}`,
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const { data: integration, error: integrationError } = await supabase
        .from("integrations")
        .select("webhook_url, api_key, instance_name")
        .eq("user_id", user.id)
        .eq("platform", "whatsapp")
        .eq("is_active", true)
        .maybeSingle()

      if (integrationError) {
        console.error("Erro ao buscar integração:", integrationError)
        
        const isTableNotFound = integrationError.message?.includes("does not exist") || 
                                integrationError.code === "PGRST116" ||
                                integrationError.message?.includes("relation") ||
                                integrationError.message?.includes("406")
        
        toast({
          title: "Erro",
          description: isTableNotFound
            ? "Tabela 'integrations' não encontrada. Execute a migração 002_integrations.sql no Supabase."
            : `Erro: ${integrationError.message || integrationError.code || "Erro desconhecido"}`,
          variant: "destructive",
        })
        return
      }

      if (!integration || !integration.webhook_url) {
        toast({
          title: "Atenção",
          description: "Nenhuma integração encontrada ou webhook_url não configurada. Configure uma em /setup primeiro.",
          variant: "destructive",
        })
        return
      }

      const cleanUrl = integration.webhook_url.replace(/\/$/, "")
      const currentWebhookUrl = webhookUrl || (typeof window !== "undefined" ? `${window.location.origin}/api/webhook/whatsapp` : "")

      // Verifica webhook na Evolution API
      const checkResponse = await fetch(
        `${cleanUrl}/webhook/find/${integration.instance_name}`,
        {
          method: "GET",
          headers: {
            "apikey": integration.api_key,
          },
        }
      )

      if (checkResponse.ok) {
        const webhookData = await checkResponse.json()
        toast({
          title: "Webhook Configurado",
          description: `URL: ${webhookData?.url || "Não encontrado"}`,
        })
      } else {
        toast({
          title: "Atenção",
          description: "Webhook não encontrado na Evolution API. Configure manualmente.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Debug - Webhook WhatsApp</h1>
          <p className="text-muted-foreground">
            Ferramentas para testar e debugar o webhook
          </p>
        </div>

        <div className="space-y-6">
          {/* Card informativo quando não há integração */}
          {result && result.error && result.error.includes("Nenhuma integração") && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Configure uma Integração Primeiro
                </CardTitle>
                <CardDescription>
                  Você precisa configurar uma integração WhatsApp antes de testar o webhook.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => router.push("/setup")} 
                  className="w-full"
                  size="lg"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Ir para Página de Configuração
                </Button>
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Na página de configuração, você pode:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Conectar seu WhatsApp via Evolution API</li>
                  <li>Configurar webhook automaticamente</li>
                  <li>Escanear QR Code para autenticação</li>
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Testar Webhook</CardTitle>
              <CardDescription>
                Envia uma mensagem de teste para verificar se o webhook está funcionando
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testMessage">Mensagem de Teste</Label>
                <Input
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Digite uma mensagem de teste"
                />
              </div>
              <Button onClick={testWebhook} disabled={testing} className="w-full">
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Teste
                  </>
                )}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {result.success ? "Sucesso!" : "Erro"}
                      </h4>
                      {result.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {result.error}
                        </p>
                      )}
                      {result.status && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Status: {result.status}
                        </p>
                      )}
                    </div>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Ver Detalhes
                    </summary>
                    <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verificar Configuração</CardTitle>
              <CardDescription>
                Verifica se o webhook está configurado na Evolution API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={checkWebhookConfig} variant="outline" className="w-full">
                <AlertCircle className="mr-2 h-4 w-4" />
                Verificar Webhook na Evolution API
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Úteis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <strong>URL do Webhook:</strong>
                <code className="ml-2 px-2 py-1 bg-muted rounded">
                  {webhookUrl || "Carregando..."}
                </code>
              </div>
              <div>
                <strong>Endpoint de Teste:</strong>
                <code className="ml-2 px-2 py-1 bg-muted rounded">
                  {testUrl || "Carregando..."}
                </code>
              </div>
              
              {result && result.error && result.error.includes("migração") && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ Tabela 'integrations' não encontrada
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-2">
                    Execute a migração no Supabase:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300 mb-2">
                    <li>Acesse o Supabase Dashboard</li>
                    <li>Vá em SQL Editor</li>
                    <li>Execute o arquivo: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">supabase/migrations/002_integrations.sql</code></li>
                  </ol>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Ou veja o arquivo <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">MIGRACAO-INTEGRACOES.md</code> para instruções detalhadas.
                  </p>
                </div>
              )}

              {result && result.error && result.error.includes("Nenhuma integração") && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    ℹ️ Configure uma integração primeiro
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mb-3">
                    Você precisa configurar uma integração WhatsApp antes de testar o webhook.
                  </p>
                  <Button 
                    onClick={() => router.push("/setup")} 
                    className="w-full"
                    variant="default"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Ir para Configuração
                  </Button>
                </div>
              )}
              
              <p className="text-muted-foreground mt-4">
                💡 <strong>Dica:</strong> Verifique os logs do servidor para ver mensagens recebidas e erros.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
