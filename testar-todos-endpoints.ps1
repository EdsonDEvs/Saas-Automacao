# Testa TODOS os endpoints possíveis para webhook
$evolutionApiUrl = "https://evolutionapi.alfredoia.com.br"
$apiKey = "DPzFv4cR7ClRQ0EJ2Ocix8DIa3yLmm7o"
$instanceName = "minha-empresattt"
$webhookUrl = "http://localhost:3000/api/webhook/whatsapp"

Write-Host "Testando TODOS os endpoints possíveis..." -ForegroundColor Cyan
Write-Host ""

$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers.Add("Content-Type", "application/json")
$headers.Add("apikey", $apiKey)

$bodyObject = @{
    url = $webhookUrl
    webhook_by_events = $false
    webhook_base64 = $false
    events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED")
    instanceName = $instanceName
}

$bodyJson = $bodyObject | ConvertTo-Json

# Lista de TODOS os endpoints possíveis
$endpoints = @(
    "/webhook/set/$instanceName",
    "/webhook/$instanceName",
    "/webhook/instance",
    "/webhook/instance/$instanceName",
    "/webhook/create",
    "/webhook/update/$instanceName",
    "/instance/$instanceName/webhook",
    "/instance/webhook/$instanceName",
    "/instance/$instanceName/update",
    "/instance/update/$instanceName"
)

foreach ($endpoint in $endpoints) {
    $url = "$evolutionApiUrl$endpoint"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "Testando: POST $endpoint" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $bodyJson -ErrorAction Stop
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        $response | ConvertTo-Json | Write-Host -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Endpoint correto encontrado: $endpoint" -ForegroundColor Green
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
