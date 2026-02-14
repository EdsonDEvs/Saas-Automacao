"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, XCircle, RefreshCw, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface WhatsAppStatusCardProps {
  instanceName: string
  phoneNumber?: string
}

export function WhatsAppStatusCard({ instanceName, phoneNumber }: WhatsAppStatusCardProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [status, setStatus] = useState<string>("unknown")
  const [availableInstances, setAvailableInstances] = useState<string[]>([])
  const [webhookConfigured, setWebhookConfigured] = useState<boolean | null>(null)
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(phoneNumber || null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<{ name?: string; status?: string } | null>(null)
  const { toast } = useToast()

  const checkStatus = async () => {
    if (!instanceName) return
    
    setIsChecking(true)
    try {
      const encodedInstanceName = encodeURIComponent(instanceName)
      const response = await fetch(`/api/evolution/status?instance=${encodedInstanceName}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setIsConnected(false)
          setStatus("not_found")
          return
        }
        throw new Error(`Erro ${response.status}`)
      }

      const data = await response.json()
      console.log("[WhatsApp Status] Resposta completa:", JSON.stringify(data, null, 2))
      
      setIsConnected(data.connected || false)
      setStatus(data.status || "unknown")
      setWebhookConfigured(data.webhookConfigured ?? null)
      setWebhookUrl(data.webhookUrl || null)
      
      // Atualiza número, foto e informações do contato
      if (data.phoneNumber) {
        setCurrentPhoneNumber(data.phoneNumber)
      }
      
      if (data.profilePicture) {
        setProfilePicture(data.profilePicture)
      }
      
      if (data.contactInfo) {
        setContactInfo(data.contactInfo)
      }
      
      // Se está conectado mas webhook não está configurado, mostra aviso
      if (data.connected && data.webhookConfigured === false) {
        console.warn(`[WhatsApp Status] ⚠️ WhatsApp conectado mas webhook não configurado!`)
      }
      
      // Se não encontrou a instância, busca todas as instâncias disponíveis
      if (data.error && data.availableInstances) {
        console.warn("[WhatsApp Status] Instância não encontrada. Disponíveis:", data.availableInstances)
        setAvailableInstances(data.availableInstances)
      } else if (data.status === "not_found" || (!data.connected && data.status !== "error")) {
        // Busca todas as instâncias disponíveis para ajudar no debug
        try {
          const listResponse = await fetch("/api/evolution/list-instances")
          if (listResponse.ok) {
            const listData = await listResponse.json()
            console.log("[WhatsApp Status] Instâncias disponíveis:", listData)
            if (listData.instances && listData.instances.length > 0) {
              setAvailableInstances(listData.instances.map((inst: any) => inst.name))
              
              // Se encontrou instâncias mas nenhuma conectada, mostra aviso
              const connectedInstances = listData.instances.filter((inst: any) => inst.connected)
              if (connectedInstances.length > 0) {
                console.warn(`[WhatsApp Status] Encontradas ${connectedInstances.length} instância(s) conectada(s), mas não corresponde ao nome salvo`)
              }
            }
          }
        } catch (error) {
          console.error("Erro ao listar instâncias:", error)
        }
      } else {
        setAvailableInstances([])
      }
      
      // Log detalhado do instanceData se disponível
      if (data.instanceData) {
        console.log("[WhatsApp Status] Dados da instância:", data.instanceData)
      }
    } catch (error: any) {
      console.error("Erro ao verificar status:", error)
      setIsConnected(false)
      setStatus("error")
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status do WhatsApp",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Verifica status ao carregar e a cada 30 segundos
  useEffect(() => {
    if (!instanceName) return
    
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // 30 segundos
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName])

  if (isConnected === null && !isChecking) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-white/70" />
          <span className="font-semibold text-gray-400 dark:text-white/90">Verificando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 dark:bg-green-500/20 border border-green-500/30 dark:border-green-500/50 shadow-sm dark:shadow-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 animate-scale-in" />
              <span className="font-bold text-green-700 dark:text-green-300">Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 dark:bg-red-500/20 border border-red-500/30 dark:border-red-500/50 shadow-sm dark:shadow-red-500/20">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="font-bold text-red-700 dark:text-red-300">Desconectado</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={isChecking}
          className="h-8 w-8 p-0"
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Foto de perfil e informações do contato */}
      {isConnected && (profilePicture || contactInfo || currentPhoneNumber) && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 transition-all duration-200 hover:bg-muted/70 animate-fade-in">
          {profilePicture ? (
            <img 
              src={profilePicture} 
              alt="Foto de perfil" 
              className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/40"
              onError={(e) => {
                // Se a imagem falhar ao carregar, esconde
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/40">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {contactInfo?.name ? (
              <p className="font-semibold text-sm truncate">{contactInfo.name}</p>
            ) : currentPhoneNumber ? (
              <p className="font-semibold text-sm truncate">{currentPhoneNumber}</p>
            ) : null}
            {contactInfo?.status && (
              <p className="text-xs text-muted-foreground truncate">{contactInfo.status}</p>
            )}
            {currentPhoneNumber && !contactInfo?.name && (
              <p className="text-xs text-muted-foreground">{currentPhoneNumber}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Instância: {instanceName}
            </p>
          </div>
        </div>
      )}

      {/* Fallback se não tiver foto mas tiver número */}
      {isConnected && !profilePicture && currentPhoneNumber && (
        <div className="space-y-1">
          <p className="text-sm font-medium">{currentPhoneNumber}</p>
          <p className="text-xs text-muted-foreground">
            Instância: {instanceName}
          </p>
        </div>
      )}

      {!isConnected && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Instância: {instanceName}
          </p>
        </div>
      )}

      {status !== "unknown" && status !== "not_found" && status !== "error" && (
        <p className="text-xs text-muted-foreground capitalize">
          Status: {status}
        </p>
      )}

      {isConnected && webhookConfigured !== null && (
        <div className={`rounded-md p-2 border ${
          webhookConfigured 
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
        }`}>
          <div className="flex items-center gap-2">
            {webhookConfigured ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-green-800 dark:text-green-200">
                  Webhook Configurado
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                  ⚠️ Webhook Não Configurado
                </span>
              </>
            )}
          </div>
          {webhookUrl && (
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {webhookUrl}
            </p>
          )}
          {!webhookConfigured && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                O webhook precisa estar configurado para receber mensagens.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={async () => {
                  setIsChecking(true)
                  try {
                    const response = await fetch("/api/evolution/one-click-onboarding", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ instanceName }),
                    })
                    const data = await response.json()
                    if (response.ok && data.webhookConfigured) {
                      toast({
                        title: "✅ Sucesso!",
                        description: "Webhook configurado automaticamente",
                      })
                      await checkStatus()
                    } else {
                      // Se precisa configurar manualmente, mostra instruções
                      if (data.manualConfigRequired && data.manualConfigInstructions) {
                        const instructions = data.manualConfigInstructions
                        toast({
                          title: "⚠️ Configuração Manual Necessária",
                          description: `Configure o webhook manualmente no painel da Evolution API. URL: ${instructions.url}`,
                          duration: 10000,
                        })
                        console.warn("[WhatsApp Status] Instruções de configuração manual:", instructions)
                      } else {
                        const errorMsg = data.error || data.details?.body || `Erro ${data.details?.status || response.status}: ${data.details?.statusText || "Erro desconhecido"}`
                        console.error("[WhatsApp Status] Erro ao configurar webhook:", data)
                        throw new Error(errorMsg)
                      }
                    }
                  } catch (error: any) {
                    toast({
                      title: "Erro",
                      description: error.message || "Não foi possível configurar o webhook",
                      variant: "destructive",
                    })
                  } finally {
                    setIsChecking(false)
                  }
                }}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  "🔧 Configurar Webhook Agora"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {status === "not_found" && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold">
            ⚠️ Instância não encontrada na Evolution API
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Procurando por: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{instanceName}</code>
          </p>
          {availableInstances.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-yellow-700 dark:text-yellow-300 font-semibold">
                Instâncias disponíveis na Evolution API:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
                {availableInstances.map((name, idx) => (
                  <li key={idx}><code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{name}</code></li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                💡 O nome da instância no sistema pode estar diferente do nome na Evolution API.
              </p>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2">
          <p className="text-xs text-red-800 dark:text-red-200">
            ❌ Erro ao verificar status. Verifique a configuração.
          </p>
        </div>
      )}

      {!isConnected && (
        <Link href="/setup">
          <Button variant="outline" className="w-full" size="sm">
            <MessageCircle className="mr-2 h-4 w-4" />
            Reconectar WhatsApp
          </Button>
        </Link>
      )}
    </div>
  )
}
