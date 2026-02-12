# Testa com captura detalhada de erros
$evolutionApiUrl = "https://evolutionapi.alfredoia.com.br"
$apiKey = "DPzFv4cR7ClRQ0EJ2Ocix8DIa3yLmm7o"
$instanceName = "minha-empresattt"
$webhookUrl = "http://localhost:3000/api/webhook/whatsapp"

Write-Host "Testando com captura detalhada de erros..." -ForegroundColor Cyan
Write-Host ""

# Testa com apikey header
$headers1 = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers1.Add("Content-Type", "application/json")
$headers1.Add("apikey", $apiKey)

# Testa com Authorization Bearer
$headers2 = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"
$headers2.Add("Content-Type", "application/json")
$headers2.Add("Authorization", "Bearer $apiKey")

$url = "$evolutionApiUrl/webhook/set/$instanceName"

# Formato que vamos testar
$bodyObject = @{
    url = $webhookUrl
    webhook_by_events = $false
    webhook_base64 = $false
    events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONNECTION_UPDATE", "QRCODE_UPDATED")
}

$bodyJson = $bodyObject | ConvertTo-Json

Write-Host "URL: $url" -ForegroundColor Yellow
Write-Host "Body: $bodyJson" -ForegroundColor Gray
Write-Host ""

# Testa com apikey
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Testando com header 'apikey'..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers1 -Body $bodyJson -ErrorAction Stop
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta: $($response.Content)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ ERRO! Status: $statusCode" -ForegroundColor Red
    
    # Tenta ler a resposta de erro
    try {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $errorReader.ReadToEnd()
        $errorReader.Close()
        $errorStream.Close()
        
        Write-Host "Resposta completa:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Red
        
        # Tenta parsear como JSON
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host ""
            Write-Host "Erro parseado:" -ForegroundColor Red
            $errorJson | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Red
        } catch {
            Write-Host "(Não é JSON válido)" -ForegroundColor DarkRed
        }
    } catch {
        Write-Host "Não foi possível ler a resposta de erro" -ForegroundColor DarkRed
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor DarkRed
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Testando com header 'Authorization Bearer'..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers2 -Body $bodyJson -ErrorAction Stop
    Write-Host "✅ SUCESSO!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta: $($response.Content)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ ERRO! Status: $statusCode" -ForegroundColor Red
    
    try {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $errorReader.ReadToEnd()
        $errorReader.Close()
        $errorStream.Close()
        
        Write-Host "Resposta completa:" -ForegroundColor Red
        Write-Host $errorBody -ForegroundColor Red
        
        try {
            $errorJson = $errorBody | ConvertFrom-Json
            Write-Host ""
            Write-Host "Erro parseado:" -ForegroundColor Red
            $errorJson | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Red
        } catch {
            Write-Host "(Não é JSON válido)" -ForegroundColor DarkRed
        }
    } catch {
        Write-Host "Não foi possível ler a resposta de erro" -ForegroundColor DarkRed
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Teste concluído!" -ForegroundColor Green
