# Script para Verificar Configuração Atual da Instância
# Isso pode nos ajudar a entender o formato esperado

$evolutionApiUrl = "https://evolutionapi.alfredoia.com.br"
$apiKey = "DPzFv4cR7ClRQ0EJ2Ocix8DIa3yLmm7o"
$instanceName = "minha-empresattt"

Write-Host "🔍 Verificando configuração da instância..." -ForegroundColor Cyan
Write-Host ""

# Tenta obter informações da instância
$endpoints = @(
    "/instance/fetchInstances",
    "/instance/fetchInstance/$instanceName",
    "/instance/connectionState/$instanceName",
    "/webhook/find/$instanceName"
)

$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $apiKey
}

foreach ($endpointPath in $endpoints) {
    $url = "$evolutionApiUrl$endpointPath"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "🔗 Testando: GET $endpointPath" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -Headers $headers -ErrorAction Stop
        
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        Write-Host "📥 Resposta:" -ForegroundColor Cyan
        $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
        Write-Host ""
        
    } catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        Write-Host "❌ ERRO! Status: $statusCode" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Verificação concluída!" -ForegroundColor Green
