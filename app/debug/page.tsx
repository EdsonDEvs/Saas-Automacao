"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ensureUserProfile } from "@/lib/supabase/ensure-profile"
import { Loader2, Send, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

export default function DebugPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testMessage, setTestMessage] = useState("teste")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const testWebhook = async () => {
    setTesting(true)
    setResult(null)

    try {
      await ensureUserProfile()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Busca integração
      const { data: integration } = await supabase
        .from("integrations")
        .select("webhook_url, api_key, instance_name")
        .eq("user_id", user.id)
        .eq("platform", "whatsapp")
        .eq("is_active", true)
        .single()

      if (!integration) {
        setResult({
          success: false,
          error: "Nenhuma integração WhatsApp ativa encontrada",
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: integration } = await supabase
        .from("integrations")
        .select("webhook_url, api_key, instance_name")
        .eq("user_id", user.id)
        .eq("platform", "whatsapp")
        .eq("is_active", true)
        .single()

      if (!integration) {
        toast({
          title: "Erro",
          description: "Nenhuma integração encontrada",
          variant: "destructive",
        })
        return
      }

      const cleanUrl = integration.webhook_url.replace(/\/$/, "")
      const webhookUrl = `${window.location.origin}/api/webhook/whatsapp`

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
          description: `URL: ${webhookData.url || "Não encontrado"}`,
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
            <CardContent className="space-y-2 text-sm">
              <div>
                <strong>URL do Webhook:</strong>
                <code className="ml-2 px-2 py-1 bg-muted rounded">
                  {typeof window !== "undefined" ? `${window.location.origin}/api/webhook/whatsapp` : ""}
                </code>
              </div>
              <div>
                <strong>Endpoint de Teste:</strong>
                <code className="ml-2 px-2 py-1 bg-muted rounded">
                  {typeof window !== "undefined" ? `${window.location.origin}/api/webhook/test` : ""}
                </code>
              </div>
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
