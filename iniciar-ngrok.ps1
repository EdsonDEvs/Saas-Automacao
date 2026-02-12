# Script para iniciar ngrok automaticamente
# Tenta encontrar ngrok em vários locais

$possiblePaths = @(
    "ngrok.exe",  # Se estiver no PATH
    "$env:LOCALAPPDATA\Microsoft\WindowsApps\ngrok.exe",  # Windows Store
    "C:\ngrok\ngrok.exe",
    "$env:USERPROFILE\Downloads\ngrok.exe",
    "$env:USERPROFILE\Desktop\ngrok.exe"
)

$ngrokPath = $null

# Procura o ngrok
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $ngrokPath = $path
        break
    }
}

# Se não encontrou, tenta usar o comando direto (se estiver no PATH)
if (-not $ngrokPath) {
    try {
        $ngrokVersion = & ngrok version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ngrokPath = "ngrok"
        }
    } catch {
        # ngrok não está no PATH
    }
}

# Se ainda não encontrou, mostra erro
if (-not $ngrokPath) {
    Write-Host "❌ ngrok não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Como instalar:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "2. Baixe a versão para Windows" -ForegroundColor Yellow
    Write-Host "3. Extraia o arquivo ngrok.exe" -ForegroundColor Yellow
    Write-Host "4. Coloque em uma pasta (ex: C:\ngrok\)" -ForegroundColor Yellow
    Write-Host "5. Configure o authtoken: .\ngrok.exe config add-authtoken SEU_TOKEN" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📖 Veja o guia completo: INSTALAR-NGROK-WINDOWS.md" -ForegroundColor Cyan
    exit 1
}

Write-Host "🚀 Iniciando ngrok na porta 3000..." -ForegroundColor Cyan
Write-Host ""

# Inicia o ngrok em uma nova janela
Start-Process -FilePath $ngrokPath -ArgumentList "http 3000"

Write-Host "✅ ngrok iniciado!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse http://localhost:4040 no navegador para ver a URL do túnel" -ForegroundColor Yellow
Write-Host "2. Copie a URL (ex: https://abc123.ngrok-free.app)" -ForegroundColor Yellow
Write-Host "3. Configure o webhook na Evolution API com: https://SUA-URL.ngrok-free.app/api/webhook/whatsapp" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Mantenha esta janela aberta enquanto desenvolve!" -ForegroundColor Red
Write-Host ""
