# Script para Testar Configuração de Webhook - Evolution API 2.3.7
# Execute este script no PowerShell

Write-Host "🧪 Teste de Configuração de Webhook - Evolution API 2.3.7" -ForegroundColor Cyan
Write-Host ""

# ============================================
# CONFIGURE AQUI SUAS INFORMAÇÕES
# ============================================
$evolutionApiUrl = "https://evolutionapi.alfredoia.com.br/"  # Substitua pela URL da sua Evolution API
$apiKey = "DPzFv4cR7ClRQ0EJ2Ocix8DIa3yLmm7o"                       # Substitua pela sua API Key
$instanceName = "minha-empresattt"                 # Substitua pelo nome da sua instância
$webhookUrl = "http://localhost:3000/api/webhook/whatsapp"  # URL do webhook

Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "  Evolution API: $evolutionApiUrl"
Write-Host "  Instância: $instanceName"
Write-Host "  Webhook URL: $webhookUrl"
Write-Host ""

# ============================================
# FORMATOS PARA TESTAR
# ============================================

$formats = @(
    @{
        Name = "Formato 1 - Mais Simples"
        Body = @{
            webhook = @{
                url = $webhookUrl
            }
        }
    },
    @{
        Name = "Formato 2 - Com Events"
        Body = @{
            webhook = @{
                url = $webhookUrl
                events = @("MESSAGES_UPSERT")
            }
        }
    },
    @{
        Name = "Formato 3 - Completo"
        Body = @{
            webhook = @{
                url = $webhookUrl
                webhook_by_events = $false
                webhook_base64 = $false
                events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE")
            }
        }
    },
    @{
        Name = "Formato 4 - Formato Antigo"
        Body = @{
            url = $webhookUrl
            webhook_by_events = $false
            events = @("MESSAGES_UPSERT")
        }
    }
)

# ============================================
# TESTE CADA FORMATO
# ============================================

$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $apiKey
}

# Remove barra final da URL se existir
$evolutionApiUrl = $evolutionApiUrl.TrimEnd('/')

# Testa diferentes endpoints e métodos de autenticação
$endpoints = @(
    @{ Path = "/webhook/set/$instanceName"; Method = "POST"; Auth = "apikey" },
    @{ Path = "/webhook/set/$instanceName"; Method = "POST"; Auth = "bearer" },
    @{ Path = "/webhook/$instanceName"; Method = "POST"; Auth = "apikey" },
    @{ Path = "/instance/update/$instanceName"; Method = "PUT"; Auth = "apikey" },
    @{ Path = "/instance/update/$instanceName"; Method = "POST"; Auth = "apikey" }
)

Write-Host "🔍 Testando formatos e endpoints..." -ForegroundColor Cyan
Write-Host ""

$successFound = $false

foreach ($endpointConfig in $endpoints) {
    if ($successFound) { break }
    
    $endpoint = "$evolutionApiUrl$($endpointConfig.Path)"
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "🔗 Endpoint: $($endpointConfig.Method) $($endpointConfig.Path)" -ForegroundColor Magenta
    Write-Host "   Autenticação: $($endpointConfig.Auth)" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""
    
    # Configura headers baseado no tipo de autenticação
    $currentHeaders = @{
        "Content-Type" = "application/json"
    }
    
    if ($endpointConfig.Auth -eq "apikey") {
        $currentHeaders["apikey"] = $apiKey
    } else {
        $currentHeaders["Authorization"] = "Bearer $apiKey"
    }
    
    foreach ($format in $formats) {
        if ($successFound) { break }
        
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "📝 Testando: $($format.Name)" -ForegroundColor Yellow
        Write-Host ""
        
        try {
        $bodyJson = $format.Body | ConvertTo-Json -Depth 10
        Write-Host "📤 Enviando:" -ForegroundColor Cyan
        Write-Host $bodyJson -ForegroundColor Gray
        Write-Host ""
        
        $response = Invoke-RestMethod -Uri $endpoint -Method $endpointConfig.Method -Headers $currentHeaders -Body $bodyJson -ErrorAction Stop
        
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        Write-Host "📥 Resposta:" -ForegroundColor Cyan
        $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Este formato funcionou!" -ForegroundColor Green
        Write-Host "   Endpoint: $($endpointConfig.Method) $($endpointConfig.Path)" -ForegroundColor Green
        Write-Host "   Autenticação: $($endpointConfig.Auth)" -ForegroundColor Green
        Write-Host "   Formato: $($format.Name)" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ Use estas configurações no código!" -ForegroundColor Green
        Write-Host ""
        
        $successFound = $true
        break
        
    } catch {
        Write-Host "❌ ERRO!" -ForegroundColor Red
        
        $statusCode = $null
        $responseBody = ""
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                $reader.Close()
            } catch {
                $responseBody = "Não foi possível ler a resposta"
            }
        } else {
            $statusCode = "N/A"
            $responseBody = $_.Exception.Message
        }
        
        Write-Host "Status: $statusCode" -ForegroundColor Red
        Write-Host "Resposta:" -ForegroundColor Red
        if ($responseBody) {
            Write-Host $responseBody -ForegroundColor Red
        } else {
            Write-Host "(Resposta vazia)" -ForegroundColor DarkRed
        }
        Write-Host ""
        }
    }
    
    if ($successFound) { break }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Teste concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Se nenhum formato funcionou:" -ForegroundColor Yellow
Write-Host "   1. Verifique se a URL da Evolution API está correta" -ForegroundColor Yellow
Write-Host "   2. Verifique se a API Key está correta" -ForegroundColor Yellow
Write-Host "   3. Verifique se o nome da instância está correto" -ForegroundColor Yellow
Write-Host "   4. Tente configurar manualmente no painel da Evolution API" -ForegroundColor Yellow
Write-Host ""
