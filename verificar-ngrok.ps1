# Script para verificar e resolver problemas do ngrok

Write-Host "Verificando ngrok..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se ngrok existe
if (-not (Test-Path "C:\ngrok\ngrok.exe")) {
    Write-Host "ERRO: ngrok nao encontrado em C:\ngrok\" -ForegroundColor Red
    Write-Host "Execute: .\instalar-ngrok.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: ngrok encontrado" -ForegroundColor Green

# 2. Verificar versao
Write-Host ""
Write-Host "Verificando versao..." -ForegroundColor Yellow
try {
    $version = & "C:\ngrok\ngrok.exe" version 2>&1
    Write-Host $version -ForegroundColor Gray
} catch {
    Write-Host "Erro ao verificar versao" -ForegroundColor Red
}

# 3. Verificar processos ngrok rodando
Write-Host ""
Write-Host "Verificando processos ngrok..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object {$_.ProcessName -like "*ngrok*"}

if ($processes) {
    Write-Host "ATENCAO: Encontrados processos ngrok rodando:" -ForegroundColor Yellow
    $processes | ForEach-Object {
        Write-Host "  - PID: $($_.Id) | Nome: $($_.ProcessName)" -ForegroundColor Gray
    }
    Write-Host ""
    $fechar = Read-Host "Deseja fechar esses processos? (S/N)"
    if ($fechar -eq "S" -or $fechar -eq "s") {
        $processes | ForEach-Object {
            Stop-Process -Id $_.Id -Force
            Write-Host "Processo $($_.Id) fechado" -ForegroundColor Green
        }
    }
} else {
    Write-Host "OK: Nenhum processo ngrok rodando" -ForegroundColor Green
}

# 4. Verificar authtoken
Write-Host ""
Write-Host "Verificando authtoken..." -ForegroundColor Yellow
$configPath = "$env:LOCALAPPDATA\ngrok\ngrok.yml"
if (Test-Path $configPath) {
    Write-Host "OK: Arquivo de configuracao encontrado" -ForegroundColor Green
    $config = Get-Content $configPath -Raw
    if ($config -match "authtoken:\s*(.+)") {
        $token = $matches[1].Trim()
        if ($token.Length -gt 20) {
            Write-Host "OK: Authtoken configurado (primeiros caracteres: $($token.Substring(0,10))...)" -ForegroundColor Green
        } else {
            Write-Host "ATENCAO: Authtoken parece invalido" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ATENCAO: Authtoken nao encontrado no arquivo de configuracao" -ForegroundColor Yellow
    }
} else {
    Write-Host "ATENCAO: Arquivo de configuracao nao encontrado" -ForegroundColor Yellow
    Write-Host "Configure o authtoken:" -ForegroundColor Cyan
    Write-Host "  cd C:\ngrok" -ForegroundColor Gray
    Write-Host "  .\ngrok.exe config add-authtoken SEU_TOKEN" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Verificacao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar o ngrok:" -ForegroundColor Cyan
Write-Host "  cd C:\ngrok" -ForegroundColor Gray
Write-Host "  .\ngrok.exe http 3000" -ForegroundColor Gray
