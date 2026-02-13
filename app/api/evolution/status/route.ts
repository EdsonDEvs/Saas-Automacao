import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    let instanceName = searchParams.get("instance")

    if (!instanceName) {
      return NextResponse.json(
        { error: "Nome da instância é obrigatório" },
        { status: 400 }
      )
    }

    // Decodifica o nome da instância
    instanceName = decodeURIComponent(instanceName)

    // Busca configuração da integração
    // Primeiro tenta buscar pela instância específica
    let integration = await supabase
      .from("integrations")
      .select("webhook_url, api_key, instance_name")
      .eq("user_id", user.id)
      .eq("platform", "whatsapp")
      .eq("instance_name", instanceName)
      .maybeSingle()
    
    // Se não encontrou, busca qualquer integração WhatsApp do usuário
    if (!integration.data) {
      const { data: allIntegrations } = await supabase
        .from("integrations")
        .select("webhook_url, api_key, instance_name")
        .eq("user_id", user.id)
        .eq("platform", "whatsapp")
        .limit(1)
        .maybeSingle()
      
      if (allIntegrations) {
        integration = { data: allIntegrations, error: null, count: null, status: 200, statusText: 'OK' }
        // Se encontrou uma integração diferente, usa o nome dela
        if (allIntegrations.instance_name && allIntegrations.instance_name !== instanceName) {
          console.log(`[Status API] Usando instância diferente: ${allIntegrations.instance_name} (procurado: ${instanceName})`)
          instanceName = allIntegrations.instance_name
        }
      }
    }
    
    const integrationData = integration.data
    const integrationError = integration.error

    if (integrationError) {
      console.error("Erro ao buscar integração:", integrationError)
      return NextResponse.json(
        { error: "Erro ao buscar integração", details: integrationError.message },
        { status: 500 }
      )
    }

    if (!integrationData) {
      return NextResponse.json(
        { error: "Integração não encontrada", status: "not_found" },
        { status: 404 }
      )
    }

    // Remove barra final da URL se existir
    const cleanUrl = integrationData.webhook_url.replace(/\/$/, "")
    
    // Verifica status na Evolution API
    let statusResponse = await fetch(
      `${cleanUrl}/instance/fetchInstances`,
      {
        method: "GET",
        headers: {
          "apikey": integrationData.api_key,
        },
      }
    )

    // Se falhar, tenta com Authorization
    if (!statusResponse.ok && statusResponse.status === 401) {
      statusResponse = await fetch(
        `${cleanUrl}/instance/fetchInstances`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${integrationData.api_key}`,
          },
        }
      )
    }

    if (!statusResponse.ok) {
      return NextResponse.json({
        connected: false,
        status: "error",
      })
    }

    let instances
    try {
      instances = await statusResponse.json()
    } catch (error) {
      console.error("Erro ao parsear resposta:", error)
      return NextResponse.json({
        connected: false,
        status: "error",
        error: "Resposta inválida da Evolution API",
      })
    }

    // Log para debug
    console.log(`[Status API] Buscando instância: ${instanceName}`)
    console.log(`[Status API] Resposta da Evolution API:`, JSON.stringify(instances, null, 2))

    // Pode retornar array ou objeto
    const instancesArray = Array.isArray(instances) ? instances : (instances.data || instances.instances || [instances])
    
    console.log(`[Status API] Total de instâncias encontradas: ${instancesArray.length}`)
    
    // Se só tem uma instância, usa ela automaticamente
    if (instancesArray.length === 1) {
      console.log(`[Status API] Apenas uma instância encontrada, usando automaticamente`)
      const singleInstance = instancesArray[0]
      const singleInstanceName = singleInstance.instance?.instanceName || singleInstance.instanceName || singleInstance.name || singleInstance.instance?.name
      if (singleInstanceName && singleInstanceName !== instanceName) {
        console.log(`[Status API] Nome da instância diferente: "${singleInstanceName}" (procurado: "${instanceName}")`)
        // Atualiza o nome no banco se for diferente
        await supabase
          .from("integrations")
          .update({ instance_name: singleInstanceName })
          .eq("user_id", user.id)
          .eq("platform", "whatsapp")
        instanceName = singleInstanceName
      }
    }
    
    // Tenta encontrar a instância de diferentes formas
    let instance = instancesArray.find((inst: any) => {
      const name = inst.instance?.instanceName || inst.instanceName || inst.name || inst.instance?.name
      console.log(`[Status API] Comparando: "${name}" === "${instanceName}"`)
      return instanceName && (name === instanceName || name?.toLowerCase() === instanceName.toLowerCase())
    })

    // Se não encontrou, tenta buscar sem case-sensitive
    if (!instance && instanceName) {
      const instanceNameLower = instanceName.toLowerCase()
      instance = instancesArray.find((inst: any) => {
        const name = inst.instance?.instanceName || inst.instanceName || inst.name || inst.instance?.name
        return name?.toLowerCase() === instanceNameLower
      })
    }
    
    // Se ainda não encontrou e só tem uma instância, usa ela
    if (!instance && instancesArray.length === 1) {
      instance = instancesArray[0]
      console.log(`[Status API] Usando única instância disponível`)
    }
    
    // Se ainda não encontrou, tenta usar a primeira instância conectada
    if (!instance && instancesArray.length > 0) {
      console.log(`[Status API] Instância "${instanceName}" não encontrada, procurando primeira instância conectada`)
      const connectedInstances = instancesArray.filter((inst: any) => {
        const instData = inst.instance || inst
        const instStatus = instData.status || instData.state || "unknown"
        return instStatus === "open" || 
               instStatus === "connected" || 
               instStatus?.toLowerCase() === "open" ||
               instStatus?.toLowerCase() === "connected"
      })
      
      if (connectedInstances.length > 0) {
        instance = connectedInstances[0]
        const foundName = (instance.instance || instance).instanceName || (instance.instance || instance).name
        console.log(`[Status API] Usando primeira instância conectada: "${foundName}"`)
        
        // Atualiza o nome da instância no banco
        if (foundName && foundName !== instanceName) {
          await supabase
            .from("integrations")
            .update({ instance_name: foundName })
            .eq("user_id", user.id)
            .eq("platform", "whatsapp")
          instanceName = foundName
        }
      }
    }
    
    // Se ainda não encontrou, usa a primeira instância disponível
    if (!instance && instancesArray.length > 0) {
      instance = instancesArray[0]
      const foundName = (instance.instance || instance).instanceName || (instance.instance || instance).name
      console.log(`[Status API] Usando primeira instância disponível: "${foundName}"`)
      
      // Atualiza o nome da instância no banco
      if (foundName && foundName !== instanceName) {
        await supabase
          .from("integrations")
          .update({ instance_name: foundName })
          .eq("user_id", user.id)
          .eq("platform", "whatsapp")
        instanceName = foundName
      }
    }

    if (!instance) {
      const availableNames = instancesArray.map((inst: any) => {
        const instData = inst.instance || inst
        return {
          name: instData.instanceName || instData.name || "unknown",
          status: instData.status || instData.state || "unknown"
        }
      })
      console.error(`[Status API] Nenhuma instância encontrada. Instâncias disponíveis:`, availableNames)
      return NextResponse.json({
        connected: false,
        status: "not_found",
        error: `Instância "${instanceName}" não encontrada na Evolution API`,
        availableInstances: availableNames.map((inst: any) => inst.name),
        allInstances: availableNames
      })
    }

    let instanceData = instance.instance || instance
    console.log(`[Status API] Dados da instância (inicial):`, JSON.stringify(instanceData, null, 2))
    
    // Tenta buscar informações mais detalhadas da instância usando diferentes endpoints
    const detailEndpoints = [
      `/instance/connectionState/${instanceName}`,
      `/instance/fetchInstance/${instanceName}`,
      `/instance/status/${instanceName}`,
    ]
    
    for (const endpoint of detailEndpoints) {
      try {
        const detailResponse = await fetch(
          `${cleanUrl}${endpoint}`,
          {
            method: "GET",
            headers: {
              "apikey": integrationData.api_key,
            },
          }
        )
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json()
          console.log(`[Status API] Dados detalhados de ${endpoint}:`, JSON.stringify(detailData, null, 2))
          // Mescla os dados detalhados com os dados iniciais
          instanceData = { ...instanceData, ...detailData }
          break // Se encontrou, para de tentar outros endpoints
        }
      } catch (error) {
        // Continua tentando outros endpoints
      }
    }
    
    // Busca o número real da instância (pode estar em diferentes campos)
    const phoneNumber = instanceData.phoneNumber || 
                       instanceData.phone || 
                       instanceData.number ||
                       instanceData.owner ||
                       instanceData.ownerNumber ||
                       instanceData.wid?.user || // WhatsApp ID format
                       instanceData.wid?.split('@')[0] || // Extrai número do JID
                       null
    
    // Verifica diferentes valores que indicam conexão
    const status = instanceData.status || instanceData.state || instanceData.connectionState || "unknown"
    const state = instanceData.state || instanceData.connectionState || status
    
    // Verifica se está conectado de várias formas
    // Primeiro verifica estados explícitos de conexão
    const isExplicitlyConnected = 
      status === "open" || 
      status === "connected" || 
      status === "CONNECTED" ||
      status?.toLowerCase() === "open" ||
      status?.toLowerCase() === "connected" ||
      state === "open" ||
      state === "connected" ||
      state === "CONNECTED" ||
      state?.toLowerCase() === "open" ||
      state?.toLowerCase() === "connected"
    
    // Se não tem status explícito, verifica outros indicadores
    const hasQrcode = !!(instanceData.qrcode || instanceData.base64 || instanceData.qr)
    const isExplicitlyDisconnected = 
      status === "close" || 
      status === "closed" || 
      status === "CLOSED" ||
      status === "disconnected" ||
      status === "DISCONNECTED" ||
      state === "close" ||
      state === "closed" ||
      state === "disconnected"
    
    // Se não tem QR code e não está explicitamente desconectado, provavelmente está conectado
    const hasConnectionIndicators = 
      phoneNumber !== null || // Se tem número, provavelmente está conectado
      (!hasQrcode && !isExplicitlyDisconnected) // Sem QR code e não está fechado = já foi escaneado
    
    // Considera conectado se:
    // 1. Status explícito de conexão OU
    // 2. Status unknown mas tem indicadores de conexão (sem QR code = já escaneou)
    const isConnected = isExplicitlyConnected || (status === "unknown" && hasConnectionIndicators && !hasQrcode)
    
    console.log(`[Status API] Análise de conexão:`, {
      isExplicitlyConnected,
      hasQrcode,
      isExplicitlyDisconnected,
      hasConnectionIndicators,
      phoneNumber,
      finalIsConnected: isConnected
    })
    
    console.log(`[Status API] Status: ${status}, State: ${state}, Conectado: ${isConnected}, Número: ${phoneNumber}`)
    console.log(`[Status API] Dados completos da instância:`, {
      status: instanceData.status,
      state: instanceData.state,
      connectionState: instanceData.connectionState,
      hasQrcode: !!instanceData.qrcode,
      phoneNumber: phoneNumber,
      allFields: Object.keys(instanceData)
    })

    // Atualiza status e número no banco quando conectado
    if (isConnected) {
      const updateData: any = { is_active: true }
      
      // Atualiza o número se encontrou um diferente
      if (phoneNumber) {
        updateData.phone_number = phoneNumber
        console.log(`[Status API] Atualizando número no banco: ${phoneNumber}`)
      }
      
      await supabase
        .from("integrations")
        .update(updateData)
        .eq("user_id", user.id)
        .eq("platform", "whatsapp")

      // Configura webhook automaticamente
      if (instanceName) {
        try {
          // Tenta obter a URL base de várias fontes
          let baseUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL
          if (!baseUrl && process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`
          }
          if (!baseUrl) {
            const origin = request.headers.get('origin')
            const host = request.headers.get('host')
            baseUrl = (origin ?? undefined) ?? 
                     (host ? `https://${host}` : undefined) ??
                     'https://seu-dominio.com'
          }
          const webhookUrl = `${baseUrl}/api/webhook/whatsapp`
          
          console.log(`[Status API] 🔧 Configurando webhook automaticamente...`)
          console.log(`[Status API] URL do webhook: ${webhookUrl}`)
          console.log(`[Status API] Instância: ${instanceName}`)
          console.log(`[Status API] Evolution API URL: ${integrationData.webhook_url}`)
          
          const webhookResponse = await fetch(
            `${integrationData.webhook_url}/webhook/set/${instanceName}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": integrationData.api_key,
              },
              body: JSON.stringify({
                url: webhookUrl,
                webhook_by_events: false,
                webhook_base64: false,
                events: [
                  "MESSAGES_UPSERT",
                  "MESSAGES_UPDATE",
                  "MESSAGES_DELETE",
                  "SEND_MESSAGE",
                  "CONNECTION_UPDATE",
                  "QRCODE_UPDATED",
                ],
              }),
            }
          )
          
          if (webhookResponse.ok) {
            const webhookData = await webhookResponse.json().catch(() => ({}))
            console.log(`[Status API] ✅ Webhook configurado com sucesso!`)
            console.log(`[Status API] Resposta:`, JSON.stringify(webhookData, null, 2))
          } else {
            const errorText = await webhookResponse.text().catch(() => "")
            console.error(`[Status API] ❌ Erro ao configurar webhook: Status ${webhookResponse.status}`)
            console.error(`[Status API] Erro:`, errorText)
          }
        } catch (error: any) {
          console.error(`[Status API] ❌ Erro ao configurar webhook automaticamente:`, error)
          console.error(`[Status API] Detalhes:`, error.message)
          // Não falha se não conseguir configurar webhook
        }
      }
    }

    // Verifica se webhook está configurado (tenta múltiplos endpoints)
    let webhookConfigured = false
    let webhookUrl = null
    if (instanceName && isConnected) {
      const cleanUrl = integrationData.webhook_url.replace(/\/$/, "")
      const checkEndpoints = [
        `/webhook/find/${instanceName}`,
        `/webhook/${instanceName}`,
        `/instance/fetchInstances`,
      ]
      
      for (const endpoint of checkEndpoints) {
        try {
          const checkResponse = await fetch(`${cleanUrl}${endpoint}`, {
            method: "GET",
            headers: {
              "apikey": integrationData.api_key,
            },
          })
          
          if (checkResponse.ok) {
            const webhookData = await checkResponse.json().catch(() => ({}))
            
            // Tenta diferentes formatos de resposta
            webhookUrl = webhookData?.url || 
                        webhookData?.webhook?.url || 
                        webhookData?.data?.url ||
                        webhookData?.[0]?.webhook?.url ||
                        null
            
            if (webhookUrl) {
              webhookConfigured = true
              console.log(`[Status API] ✅ Webhook encontrado: ${webhookUrl}`)
              break
            }
          }
        } catch (error) {
          // Continua tentando outros endpoints
          continue
        }
      }
      
      // Se não encontrou webhook configurado, tenta configurar novamente
      if (!webhookConfigured && isConnected) {
        try {
          let baseUrl: string | undefined = process.env.NEXT_PUBLIC_APP_URL
          if (!baseUrl && process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`
          }
          if (!baseUrl) {
            const origin = request.headers.get('origin')
            const host = request.headers.get('host')
            baseUrl = (origin ?? undefined) ?? 
                     (host ? `https://${host}` : undefined)
          }
          
          if (baseUrl) {
            const webhookUrlToSet = `${baseUrl}/api/webhook/whatsapp`
            console.log(`[Status API] 🔄 Tentando configurar webhook novamente: ${webhookUrlToSet}`)
            
            const retryResponse = await fetch(
              `${cleanUrl}/webhook/set/${instanceName}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": integrationData.api_key,
                },
                body: JSON.stringify({
                  url: webhookUrlToSet,
                  webhook_by_events: false,
                  webhook_base64: false,
                  events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
                }),
              }
            )
            
            if (retryResponse.ok) {
              webhookConfigured = true
              webhookUrl = webhookUrlToSet
              console.log(`[Status API] ✅ Webhook configurado com sucesso na verificação!`)
            }
          }
        } catch (error) {
          console.error(`[Status API] Erro ao reconfigurar webhook:`, error)
        }
      }
      
      if (!webhookConfigured) {
        console.log(`[Status API] ⚠️ Webhook não configurado após todas as tentativas`)
      }
    }

    return NextResponse.json({
      connected: isConnected,
      status: instanceData.status || instanceData.state || "unknown",
      qrcode: instanceData.qrcode?.base64 || instanceData.qrcode || null,
      phoneNumber: phoneNumber,
      webhookConfigured: webhookConfigured,
      webhookUrl: webhookUrl,
      instanceData: {
        status: instanceData.status,
        state: instanceData.state,
        instanceName: instanceData.instanceName || instanceName,
        phoneNumber: phoneNumber,
      }
    })
  } catch (error: any) {
    console.error("Erro ao verificar status:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao verificar status" },
      { status: 500 }
    )
  }
}
