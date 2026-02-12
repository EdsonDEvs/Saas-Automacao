# 🚀 Instalar ngrok AGORA - Passo a Passo Rápido

## ⚡ Passo a Passo Rápido

### 1️⃣ Baixar ngrok

**Opção A: Via Navegador (Recomendado)**
1. Abra o navegador
2. Acesse: **https://ngrok.com/download**
3. Clique em **"Download for Windows"**
4. O arquivo `ngrok-v3-stable-windows-amd64.zip` será baixado

**Opção B: Via PowerShell (Direto)**
```powershell
# Baixa o ngrok direto
Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile "$env:USERPROFILE\Downloads\ngrok.zip"
```

### 2️⃣ Extrair o ngrok

**Opção A: Manual**
1. Vá até `C:\Users\Dev_Edson\Downloads`
2. Encontre o arquivo `ngrok-v3-stable-windows-amd64.zip`
3. Clique com botão direito → **"Extrair Tudo"**
4. Escolha a pasta: `C:\ngrok`
5. Clique em **"Extrair"**

**Opção B: Via PowerShell**
```powershell
# Cria a pasta C:\ngrok
New-Item -ItemType Directory -Force -Path "C:\ngrok"

# Extrai o ZIP
Expand-Archive -Path "$env:USERPROFILE\Downloads\ngrok-v3-stable-windows-amd64.zip" -DestinationPath "C:\ngrok" -Force
```

### 3️⃣ Verificar se extraiu corretamente

```powershell
# Verifica se o arquivo existe
Test-Path "C:\ngrok\ngrok.exe"
```

Se retornar `True`, está tudo certo!

### 4️⃣ Configurar Authtoken

```powershell
# Navega até a pasta
cd C:\ngrok

# Configura o authtoken
.\ngrok.exe config add-authtoken cr_2q7Iv9MZBh4eDXukeLjdDQ45zmS
```

Você deve ver: `Authtoken saved to configuration file: C:\Users\Dev_Edson\AppData\Local\ngrok\ngrok.yml`

### 5️⃣ Testar

```powershell
# Inicia o ngrok na porta 3000
.\ngrok.exe http 3000
```

Você verá algo como:
```
Session Status                online
Account                       seu-email@exemplo.com
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copie a URL `https://abc123.ngrok-free.app`** - essa é sua URL pública!

---

## 🎯 Script Automático Completo

Cole este script no PowerShell para fazer tudo automaticamente:

```powershell
# Script de instalação automática do ngrok
Write-Host "🚀 Instalando ngrok..." -ForegroundColor Cyan

# 1. Criar pasta
Write-Host "📁 Criando pasta C:\ngrok..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\ngrok" | Out-Null

# 2. Baixar ngrok
Write-Host "📥 Baixando ngrok..." -ForegroundColor Yellow
$downloadUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
$zipPath = "$env:TEMP\ngrok.zip"
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

# 3. Extrair
Write-Host "📦 Extraindo..." -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath "C:\ngrok" -Force

# 4. Limpar arquivo temporário
Remove-Item $zipPath

# 5. Verificar
if (Test-Path "C:\ngrok\ngrok.exe") {
    Write-Host "✅ ngrok instalado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Configure o authtoken:" -ForegroundColor Yellow
    Write-Host "   cd C:\ngrok" -ForegroundColor Gray
    Write-Host "   .\ngrok.exe config add-authtoken cr_2q7Iv9MZBh4eDXukeLjdDQ45zmS" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Inicie o ngrok:" -ForegroundColor Yellow
    Write-Host "   .\ngrok.exe http 3000" -ForegroundColor Gray
} else {
    Write-Host "❌ Erro na instalação" -ForegroundColor Red
}
```

---

## ✅ Depois de Instalar

### Configurar authtoken:
```powershell
cd C:\ngrok
.\ngrok.exe config add-authtoken cr_2q7Iv9MZBh4eDXukeLjdDQ45zmS
```

### Iniciar ngrok:
```powershell
.\ngrok.exe http 3000
```

### Ver a URL:
Acesse `http://localhost:4040` no navegador ou veja no terminal

### Configurar webhook:
Use a URL do ngrok na Evolution API: `https://SUA-URL.ngrok-free.app/api/webhook/whatsapp`

---

## 🆘 Problemas?

### "Não consigo baixar"
- Tente baixar manualmente pelo navegador
- Verifique sua conexão com internet

### "Erro ao extrair"
- Verifique se tem permissão para criar pasta em C:\
- Ou extraia em outra pasta (ex: `C:\Users\Dev_Edson\ngrok`)

### "Authtoken inválido"
- Verifique se copiou o token completo
- Acesse: https://dashboard.ngrok.com/get-started/your-authtoken
