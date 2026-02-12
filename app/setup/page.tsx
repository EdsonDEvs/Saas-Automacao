"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ensureUserProfile } from "@/lib/supabase/ensure-profile"
import { CheckCircle2, ArrowRight, Loader2, Copy, Check, QrCode, RefreshCw } from "lucide-react"

type Integration = {
  id?: string
  platform: string
  webhook_url?: string
  api_key?: string
  instance_name?: string
  phone_number?: string
  bot_token?: string
  is_active: boolean
}

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [platform, setPlatform] = useState<string>("")
  const [integration, setIntegration] = useState<Integration>({
    platform: "",
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [creatingInstance, setCreatingInstance] = useState(false)
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [onboardingRunning, setOnboardingRunning] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const getWebhookUrl = () => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/api/webhook/${platform}`
  }

  const handleNext = () => {
    if (step === 1 && !platform) {
      toast({
        title: "Selecione uma plataforma",
        variant: "destructive",
      })
      return
    }
    setStep(step + 1)
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        await ensureUserProfile()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_name")
          .eq("id", user.id)
          .maybeSingle()
        if (profile?.business_name) {
          const slug = profile.business_name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
          if (!integration.instance_name) {
            setIntegration({ ...integration, instance_name: slug || `instancia-${user.id.slice(0, 6)}` })
          }
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      }
    }

    loadProfile()
  }, [])

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await ensureUserProfile()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login novamente",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // Valida campos obrigatórios
      if (platform === "whatsapp" && !integration.instance_name) {
        toast({
          title: "Nome da instância obrigatório",
          description: "Defina um nome para sua instância do WhatsApp.",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Remove platform do integration para evitar duplicação
      const { platform: _, ...integrationWithoutPlatform } = integration as any
      
      const { error, data } = await supabase
        .from("integrations")
        .upsert({
          user_id: user.id,
          platform: platform,
          ...integrationWithoutPlatform,
          is_active: integration.is_active ?? true,
        }, {
          onConflict: "user_id,platform"
        })
        .select()

      if (error) {
        console.error("Erro ao salvar integração:", error)
        throw error
      }

      console.log("Integração salva com sucesso:", data)

      toast({
        title: "Sucesso!",
        description: "Integração configurada com sucesso!",
      })
      setStep(4) // Vai para o passo final
    } catch (error: any) {
      console.error("Erro completo:", error)
      toast({
        title: "Erro",
        description: error.message || error.details || "Erro ao salvar configuração",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const copyWebhookUrl = async () => {
    await navigator.clipboard.writeText(getWebhookUrl())
    setCopied(true)
    toast({
      title: "Copiado!",
      description: "URL do webhook copiada para a área de transferência.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreateInstance = async () => {
    setCreatingInstance(true)
    try {
      const response = await fetch("/api/evolution/create-instance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instanceName: integration.instance_name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar instância")
      }

      if (data.qrcode) {
        setQrcode(data.qrcode)
        toast({
          title: "Instância criada!",
          description: "Escaneie o QR Code com seu WhatsApp",
        })
        // Inicia verificação automática
        startStatusCheck(data.instanceName)
      } else {
        // Tenta buscar QR Code
        await fetchQRCode(data.instanceName)
      }
    } catch (error: any) {
      let errorMessage = error.message || "Erro ao criar instância"
      
      // Melhora mensagens de erro comuns
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        errorMessage = "Erro de autenticação. Verifique se a API Key está correta e se o servidor Evolution API está configurado corretamente."
      } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        errorMessage = "URL não encontrada. Verifique se a URL do servidor Evolution API está correta."
      } else if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        errorMessage = "Uma instância com este nome já existe. Escolha outro nome ou delete a instância existente."
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // 10 segundos para mensagens de erro
      })
    } finally {
      setCreatingInstance(false)
    }
  }

  const fetchQRCode = async (instanceName: string) => {
    try {
      const response = await fetch(`/api/evolution/qrcode?instance=${instanceName}`)
      const data = await response.json()

      if (data.qrcode) {
        setQrcode(data.qrcode)
        startStatusCheck(instanceName)
      }
    } catch (error) {
      console.error("Erro ao buscar QR Code:", error)
    }
  }

  const checkConnectionStatus = async () => {
    if (!integration.instance_name) return

    setCheckingStatus(true)
    try {
      const encodedInstanceName = encodeURIComponent(integration.instance_name)
      const response = await fetch(`/api/evolution/status?instance=${encodedInstanceName}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Erro",
          description: errorData.error || `Erro ao verificar status: ${response.status}`,
          variant: "destructive",
        })
        return
      }

      const data = await response.json()

      if (data.connected) {
        setIsConnected(true)
        setQrcode(null)
        await runOneClickOnboarding(data.instanceName || integration.instance_name)
        toast({
          title: "Conectado!",
          description: "WhatsApp conectado com sucesso!",
        })
      } else if (data.qrcode) {
        setQrcode(data.qrcode)
      } else if (data.status === "not_found") {
        toast({
          title: "Instância não encontrada",
          description: "A instância não foi encontrada. Tente criar novamente.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Erro ao verificar status:", error)
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar conexão",
        variant: "destructive",
      })
    } finally {
      setCheckingStatus(false)
    }
  }

  const startStatusCheck = (instanceName: string) => {
    let qrCodeUpdateCounter = 0
    const maxQrCodeUpdates = 20 // Atualiza QR Code até 20 vezes (1 minuto)
    
    // Verifica status a cada 3 segundos
    const interval = setInterval(async () => {
      if (isConnected) {
        clearInterval(interval)
        return
      }

      try {
        const encodedInstanceName = encodeURIComponent(instanceName)
        const response = await fetch(`/api/evolution/status?instance=${encodedInstanceName}`)
        
        if (!response.ok) {
          // Se der erro 401 (não autenticado) ou 404 (não encontrado), para de verificar
          if (response.status === 401 || response.status === 404 || response.status >= 500) {
            clearInterval(interval)
            console.log("Parando verificação automática devido a erro:", response.status)
          }
          return
        }

        const data = await response.json()

        if (data.connected) {
          setIsConnected(true)
          setQrcode(null)
          await runOneClickOnboarding(data.instanceName || instanceName)
          clearInterval(interval)
          toast({
            title: "Conectado!",
            description: "WhatsApp conectado com sucesso!",
          })
        } else if (data.qrcode && data.qrcode !== qrcode) {
          // Atualiza QR Code se for diferente
          setQrcode(data.qrcode)
          qrCodeUpdateCounter = 0 // Reset contador quando recebe novo QR
        } else if (!data.qrcode && qrCodeUpdateCounter < maxQrCodeUpdates) {
          // Se não tem QR Code, tenta buscar um novo a cada 10 verificações (30 segundos)
          qrCodeUpdateCounter++
          if (qrCodeUpdateCounter % 10 === 0) {
            await fetchQRCode(instanceName)
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error)
        // Para de verificar se houver erro constante
        clearInterval(interval)
      }
    }, 3000)

    // Limpa o interval após 10 minutos
    setTimeout(() => clearInterval(interval), 600000)
  }

  const runOneClickOnboarding = async (instanceName: string) => {
    if (onboardingRunning || onboardingDone) return
    setOnboardingRunning(true)
    try {
      const response = await fetch("/api/evolution/one-click-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ instanceName }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Erro ao executar onboarding automático")
      }
      setOnboardingDone(true)
      if (data.welcomeSent) {
        toast({
          title: "🎉 Tudo pronto!",
          description: "Enviamos uma mensagem de boas-vindas no WhatsApp.",
        })
      }
    } catch (error: any) {
      console.error("Erro no onboarding automático:", error)
      toast({
        title: "Aviso",
        description: "Conectado, mas não foi possível completar o onboarding automático.",
        variant: "destructive",
      })
    } finally {
      setOnboardingRunning(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Escolha a Plataforma</h3>
            <p className="text-muted-foreground">
              Selecione onde você quer que seu agente IA atenda os clientes
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card
                className={`cursor-pointer transition-all ${
                  platform === "whatsapp" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  setPlatform("whatsapp")
                  setIntegration({ ...integration, platform: "whatsapp" })
                }}
              >
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">
                    Integração com WhatsApp Business via Evolution API ou Twilio
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  platform === "telegram" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  setPlatform("telegram")
                  setIntegration({ ...integration, platform: "telegram" })
                }}
              >
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">Telegram</h4>
                  <p className="text-sm text-muted-foreground">
                    Crie um bot no Telegram e conecte facilmente
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  platform === "webhook" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => {
                  setPlatform("webhook")
                  setIntegration({ ...integration, platform: "webhook" })
                }}
              >
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">Webhook Genérico</h4>
                  <p className="text-sm text-muted-foreground">
                    Use com qualquer sistema que suporte webhooks
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 2:
        if (platform === "whatsapp") {
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Configurar WhatsApp</h3>
              <p className="text-muted-foreground">
                Configure sua integração com WhatsApp Business
              </p>

              {!qrcode && !isConnected && (
                <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instance_name">Nome da Instância</Label>
                  <Input
                    id="instance_name"
                    placeholder="minha-loja"
                    value={integration.instance_name || ""}
                    onChange={(e) => {
                      // Remove espaços e caracteres especiais, converte para minúsculas
                      const cleaned = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                      setIntegration({ ...integration, instance_name: cleaned })
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Apenas letras minúsculas, números e hífens (ex: minha-loja). Espaços serão convertidos automaticamente.
                  </p>
                </div>

                  <Button
                    onClick={handleCreateInstance}
                    disabled={creatingInstance || !integration.instance_name}
                    className="w-full"
                  >
                    {creatingInstance ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando Instância...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Criar Instância e Gerar QR Code
                      </>
                    )}
                  </Button>
                </div>
              )}

              {qrcode && !isConnected && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-semibold mb-2">Escaneie o QR Code com seu WhatsApp</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Abra o WhatsApp no celular → Menu → Aparelhos conectados → Conectar um aparelho
                    </p>
                    
                    <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        ⚠️ <strong>Importante:</strong> Se aparecer "Não é possível conectar novos dispositivos", 
                        desconecte outros dispositivos primeiro ou aguarde alguns minutos e tente novamente.
                      </p>
                    </div>

                    <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed">
                      {qrcode && qrcode.startsWith('data:') ? (
                        <img
                          src={qrcode}
                          alt="QR Code WhatsApp"
                          className="w-64 h-64"
                        />
                      ) : qrcode ? (
                        <img
                          src={`data:image/png;base64,${qrcode}`}
                          alt="QR Code WhatsApp"
                          className="w-64 h-64"
                          onError={(e) => {
                            console.error("Erro ao carregar QR Code:", e)
                            toast({
                              title: "Erro",
                              description: "QR Code inválido. Clique em 'Atualizar QR Code' para gerar um novo.",
                              variant: "destructive",
                            })
                          }}
                        />
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-center mt-4">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (!integration.instance_name) return
                          setQrcode(null)
                          await fetchQRCode(integration.instance_name)
                        }}
                        disabled={creatingInstance}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar QR Code
                      </Button>
                      <Button
                        variant="outline"
                        onClick={checkConnectionStatus}
                        disabled={checkingStatus}
                      >
                        {checkingStatus ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Verificar Conexão
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      O QR Code expira em ~20 segundos. O sistema atualiza automaticamente e verifica a conexão a cada 3 segundos.
                    </p>
                  </div>
                </div>
              )}

              {isConnected && (
                <div className="space-y-4 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                  <h4 className="font-semibold text-green-500">WhatsApp Conectado!</h4>
                  <p className="text-sm text-muted-foreground">
                    Sua instância está conectada e pronta para receber mensagens.
                  </p>
                </div>
              )}
            </div>
          )
        }

        if (platform === "telegram") {
          return (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Configurar Telegram</h3>
              <p className="text-muted-foreground">
                Configure seu bot do Telegram
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bot_token">Token do Bot</Label>
                  <Input
                    id="bot_token"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={integration.bot_token || ""}
                    onChange={(e) =>
                      setIntegration({ ...integration, bot_token: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtenha o token criando um bot no{" "}
                    <a
                      href="https://t.me/botfather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @BotFather
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold mb-2">Como criar um bot:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Abra o Telegram e procure por @BotFather</li>
                  <li>Envie o comando /newbot</li>
                  <li>Escolha um nome para seu bot</li>
                  <li>Escolha um username (deve terminar com "bot")</li>
                  <li>Copie o token fornecido e cole acima</li>
                </ol>
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Configurar Webhook Genérico</h3>
            <p className="text-muted-foreground">
              Configure um webhook genérico para usar com qualquer sistema
            </p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                Após salvar, você receberá uma URL de webhook única que pode ser usada em qualquer sistema que suporte webhooks.
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Webhook URL</h3>
            <p className="text-muted-foreground">
              Esta é a URL que você precisa configurar na sua plataforma:
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md bg-muted p-3 font-mono text-sm break-all">
                  {getWebhookUrl()}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyWebhookUrl}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Como configurar:</h4>
                {platform === "whatsapp" && (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      ✅ O webhook do WhatsApp é configurado automaticamente após a conexão.
                    </p>
                    <p>
                      Se precisar testar manualmente, você pode usar a URL acima.
                    </p>
                  </div>
                )}
                {platform === "telegram" && (
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Copie a URL acima</li>
                    <li>Use a API do Telegram para configurar o webhook</li>
                    <li>Ou use: <code className="bg-background px-1 rounded">curl -F "url={getWebhookUrl()}" https://api.telegram.org/bot{integration.bot_token}/setWebhook</code></li>
                  </ol>
                )}
                {platform === "webhook" && (
                  <p className="text-sm text-muted-foreground">
                    Use esta URL em qualquer sistema que suporte webhooks. As mensagens serão processadas automaticamente pelo seu agente IA.
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Configuração Concluída!</h3>
            <p className="text-muted-foreground">
              Sua integração está configurada e pronta para uso.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={() => router.push("/dashboard")}>
                Ir para Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push("/integration")}>
                Ver Integrações
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuração Guiada</h1>
        <p className="text-muted-foreground">
          Configure sua integração passo a passo de forma simples
        </p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Passo {step} de 4</CardTitle>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-2 rounded-full ${
                      s <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
            <CardDescription>
              {step === 1 && "Escolha onde seu agente vai atender"}
              {step === 2 && "Configure os dados da sua plataforma"}
              {step === 3 && "Configure o webhook na sua plataforma"}
              {step === 4 && "Tudo pronto!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderStepContent()}

            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                Voltar
              </Button>
              {step < 3 && (
                <Button onClick={handleNext}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {step === 3 && (
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Salvar e Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
