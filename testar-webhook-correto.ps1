# Script para Testar o Endpoint Correto - Evolution API 2.3.7
# Baseado na documentação: /webhook/instance

$evolutionApiUrl = "https://evolutionapi.alfredoia.com.br"
$apiKey = "DPzFv4cR7ClRQ0EJ2Ocix8DIa3yLmm7o"
$instanceName = "minha-empresattt"
$webhookUrl = "http://localhost:3000/api/webhook/whatsapp"

Write-Host "🧪 Teste com Endpoint Correto - Evolution API 2.3.7" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $apiKey
}

# Testa diferentes variações do endpoint /webhook/instance
$testCases = @(
    @{
        Name = "Teste 1: /webhook/instance com instanceName no body"
        Url = "$evolutionApiUrl/webhook/instance"
        Body = @{
            url = $webhookUrl
            webhook_by_events = $false
            webhook_base64 = $false
            events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED")
            instanceName = $instanceName
        }
    },
    @{
        Name = "Teste 2: /webhook/instance com instanceName como query param"
        Url = "$evolutionApiUrl/webhook/instance?instanceName=$instanceName"
        Body = @{
            url = $webhookUrl
            webhook_by_events = $false
            webhook_base64 = $false
            events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED")
        }
    },
    @{
        Name = "Teste 3: /webhook/instance/{instanceName}"
        Url = "$evolutionApiUrl/webhook/instance/$instanceName"
        Body = @{
            url = $webhookUrl
            webhook_by_events = $false
            webhook_base64 = $false
            events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED")
        }
    },
    @{
        Name = "Teste 4: /webhook/instance (formato simplificado)"
        Url = "$evolutionApiUrl/webhook/instance?instanceName=$instanceName"
        Body = @{
            url = $webhookUrl
            events = @("MESSAGES_UPSERT")
        }
    }
)

foreach ($test in $testCases) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📝 $($test.Name)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔗 URL: $($test.Url)" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        $bodyJson = $test.Body | ConvertTo-Json -Depth 10
        Write-Host "📤 Body:" -ForegroundColor Cyan
        Write-Host $bodyJson -ForegroundColor Gray
        Write-Host ""
        
        $response = Invoke-RestMethod -Uri $test.Url -Method POST -Headers $headers -Body $bodyJson -ErrorAction Stop
        
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        Write-Host "📥 Resposta:" -ForegroundColor Cyan
        $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Este formato funcionou!" -ForegroundColor Green
        Write-Host ""
        
        break
        
    } catch {
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
        
        Write-Host "❌ ERRO! Status: $statusCode" -ForegroundColor Red
        if ($responseBody) {
            Write-Host "Resposta: $responseBody" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Teste concluído!" -ForegroundColor Green
