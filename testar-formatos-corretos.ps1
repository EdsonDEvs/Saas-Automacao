# Testa diferentes formatos no endpoint /webhook/set/ que sabemos que existe
$evolutionApiUrl = "https://evolutionapi.alfredoia.com.br"
$apiKey = "DPzFv4cR7ClRQ0EJ2Ocix8DIa3yLmm7o"
$instanceName = "minha-empresattt"
$webhookUrl = "http://localhost:3000/api/webhook/whatsapp"

Write-Host "Testando formatos no endpoint /webhook/set/..." -ForegroundColor Cyan
Write-Host ""

$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Content-Type", "application/json")
$headers.Add("apikey", $apiKey)

$url = "$evolutionApiUrl/webhook/set/$instanceName"

# Diferentes formatos para testar
$formats = @(
    @{
        Name = "Formato 1: Apenas url (mínimo)"
        Body = @{
            url = $webhookUrl
        }
    },
    @{
        Name = "Formato 2: url + events"
        Body = @{
            url = $webhookUrl
            events = @("MESSAGES_UPSERT")
        }
    },
    @{
        Name = "Formato 3: url + webhook_by_events"
        Body = @{
            url = $webhookUrl
            webhook_by_events = $false
        }
    },
    @{
        Name = "Formato 4: Completo sem instanceName"
        Body = @{
            url = $webhookUrl
            webhook_by_events = $false
            webhook_base64 = $false
            events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED")
        }
    },
    @{
        Name = "Formato 5: Com instanceName no body"
        Body = @{
            url = $webhookUrl
            webhook_by_events = $false
            webhook_base64 = $false
            events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED")
            instanceName = $instanceName
        }
    },
    @{
        Name = "Formato 6: enabled ao invés de webhook_by_events"
        Body = @{
            url = $webhookUrl
            enabled = $true
            events = @("MESSAGES_UPSERT")
        }
    },
    @{
        Name = "Formato 7: enabled + webhook_by_events"
        Body = @{
            url = $webhookUrl
            enabled = $true
            webhook_by_events = $false
            events = @("MESSAGES_UPSERT")
        }
    }
)

foreach ($format in $formats) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Testando: $($format.Name)" -ForegroundColor Yellow
    Write-Host ""
    
    $bodyJson = $format.Body | ConvertTo-Json
    Write-Host "Body:" -ForegroundColor Cyan
    Write-Host $bodyJson -ForegroundColor Gray
    Write-Host ""
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $bodyJson -ErrorAction Stop
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        $response | ConvertTo-Json | Write-Host -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Formato correto encontrado: $($format.Name)" -ForegroundColor Green
        break
    } catch {
        $statusCode = $null
        $responseBody = ""
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
                $reader.Close()
                $stream.Close()
            } catch {
                $responseBody = "(não foi possível ler)"
            }
        } else {
            $statusCode = "N/A"
            $responseBody = $_.Exception.Message
        }
        
        Write-Host "❌ Status: $statusCode" -ForegroundColor Red
        if ($responseBody -and $responseBody.Length -lt 500) {
            Write-Host "Resposta: $responseBody" -ForegroundColor Red
        }
        Write-Host ""
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Teste concluído!" -ForegroundColor Green
