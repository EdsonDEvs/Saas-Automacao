# Teste Simples - Evolution API 2.3.7 Webhook
$evolutionApiUrl = "https://evolutionapi.alfredoia.com.br"
$apiKey = "DPzFv4cR7ClRQ0EJ2Ocix8DIa3yLmm7o"
$instanceName = "minha-empresattt"
$webhookUrl = "http://localhost:3000/api/webhook/whatsapp"

Write-Host "Testando webhook..." -ForegroundColor Cyan

$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $apiKey
}

$body = @{
    url = $webhookUrl
    webhook_by_events = $false
    webhook_base64 = $false
    events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED")
    instanceName = $instanceName
}

$bodyJson = $body | ConvertTo-Json

Write-Host "URL: $evolutionApiUrl/webhook/instance" -ForegroundColor Yellow
Write-Host "Body: $bodyJson" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$evolutionApiUrl/webhook/instance" -Method POST -Headers $headers -Body $bodyJson
    Write-Host "SUCESSO!" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host -ForegroundColor Green
} catch {
    Write-Host "ERRO!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    $reader.Close()
    Write-Host "Resposta: $responseBody" -ForegroundColor Red
}
