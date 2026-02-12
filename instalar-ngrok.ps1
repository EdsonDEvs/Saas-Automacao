# Script de instalacao automatica do ngrok
Write-Host "Instalando ngrok..." -ForegroundColor Cyan
Write-Host ""

# 1. Criar pasta
Write-Host "Criando pasta C:\ngrok..." -ForegroundColor Yellow
try {
    New-Item -ItemType Directory -Force -Path "C:\ngrok" | Out-Null
    Write-Host "Pasta criada" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar pasta: $_" -ForegroundColor Red
    Write-Host "Tente executar o PowerShell como Administrador" -ForegroundColor Yellow
    exit 1
}

# 2. Baixar ngrok
Write-Host "Baixando ngrok..." -ForegroundColor Yellow
$downloadUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
$zipPath = "$env:TEMP\ngrok.zip"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "Download concluido" -ForegroundColor Green
} catch {
    Write-Host "Erro ao baixar: $_" -ForegroundColor Red
    Write-Host "Tente baixar manualmente: https://ngrok.com/download" -ForegroundColor Yellow
    exit 1
}

# 3. Extrair
Write-Host "Extraindo..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipPath -DestinationPath "C:\ngrok" -Force
    Write-Host "Extracao concluida" -ForegroundColor Green
} catch {
    Write-Host "Erro ao extrair: $_" -ForegroundColor Red
    exit 1
}

# 4. Limpar arquivo temporario
Remove-Item $zipPath -ErrorAction SilentlyContinue

# 5. Verificar
Write-Host ""
if (Test-Path "C:\ngrok\ngrok.exe") {
    Write-Host "ngrok instalado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Configure o authtoken:" -ForegroundColor Cyan
    Write-Host "   cd C:\ngrok" -ForegroundColor Gray
    Write-Host "   .\ngrok.exe config add-authtoken cr_2q7Iv9MZBh4eDXukeLjdDQ45zmS" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Inicie o ngrok:" -ForegroundColor Cyan
    Write-Host "   .\ngrok.exe http 3000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Copie a URL do ngrok e configure o webhook na Evolution API" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "Erro: ngrok.exe nao foi encontrado apos instalacao" -ForegroundColor Red
    exit 1
}
