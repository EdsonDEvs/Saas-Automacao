$evolutionApiUrl = "https://evolutionapi.alfredoia.com.br"
$apiKey = "DPzFv4cR7ClRQ0EJ2Ocix8DIa3yLmm7o"
$instanceName = "minha-empresattt"
$webhookUrl = "http://localhost:3000/api/webhook/whatsapp"

Write-Host "Testando webhook..." -ForegroundColor Cyan
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

Write-Host "URL: $evolutionApiUrl/webhook/instance"
Write-Host "Body:"
Write-Host $bodyJson
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$evolutionApiUrl/webhook/instance" -Method POST -Headers $headers -Body $bodyJson
    Write-Host "SUCESSO!" -ForegroundColor Green
    $response | ConvertTo-Json | Write-Host -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "ERRO! Status: $statusCode" -ForegroundColor Red
    
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    $reader.Close()
    $stream.Close()
    
    Write-Host "Resposta: $responseBody" -ForegroundColor Red
}
