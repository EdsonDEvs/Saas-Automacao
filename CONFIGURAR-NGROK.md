# 🌐 Como Usar ngrok para Expor Localhost

## 📋 O que é ngrok?

O ngrok cria um túnel seguro que expõe seu `localhost:3000` para a internet, permitindo que a Evolution API acesse seu webhook.

## 🚀 Passo a Passo

### 1. Instalar ngrok

**Opção A: Download direto (Windows)**
1. Acesse: https://ngrok.com/download
2. Baixe a versão para Windows
3. Extraia o arquivo `ngrok.exe`
4. Coloque em uma pasta (ex: `C:\ngrok\`)

**Opção B: Via Chocolatey (se tiver instalado)**
```powershell
choco install ngrok
```

**Opção C: Via Scoop (se tiver instalado)**
```powershell
scoop install ngrok
```

### 2. Criar Conta no ngrok (Gratuita)

1. Acesse: https://dashboard.ngrok.com/signup
2. Crie uma conta gratuita
3. Vá em **Your Authtoken**
4. Copie seu authtoken

### 3. Configurar ngrok

No PowerShell, execute:

```powershell
# Navegue até a pasta do ngrok (ou adicione ao PATH)
cd C:\ngrok

# Configure seu authtoken
.\ngrok.exe config add-authtoken SEU_AUTHTOKEN_AQUI
```

### 4. Iniciar o Túnel

**Com seu servidor Next.js rodando em `localhost:3000`:**

```powershell
.\ngrok.exe http 3000
```

Você verá algo assim:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copie a URL `https://abc123.ngrok-free.app`** - essa é sua URL pública!

### 5. Configurar Webhook na Evolution API

1. Acesse: `https://evolutionapi.alfredoia.com.br`
2. Vá em **Settings** → **Webhooks**
3. Adicione a URL: `https://abc123.ngrok-free.app/api/webhook/whatsapp`
   - ⚠️ Use a URL do ngrok que você copiou!
   - ⚠️ Use `https://` (não `http://`)
4. Selecione os eventos:
   - ✅ MESSAGES_UPSERT
   - ✅ MESSAGES_UPDATE
   - ✅ MESSAGES_DELETE
   - ✅ SEND_MESSAGE
   - ✅ CONNECTION_UPDATE
   - ✅ QRCODE_UPDATED
5. Salve

### 6. Manter ngrok Rodando

⚠️ **IMPORTANTE:** O ngrok precisa estar rodando enquanto você desenvolve!

- Deixe o terminal do ngrok aberto
- Se fechar, o túnel para e o webhook para de funcionar
- A URL do ngrok muda a cada reinício (na versão gratuita)

## 🔧 Automatizar com Script

Crie um arquivo `iniciar-ngrok.ps1`:

```powershell
# Inicia ngrok na porta 3000
Write-Host "Iniciando ngrok..." -ForegroundColor Cyan
Start-Process -FilePath "C:\ngrok\ngrok.exe" -ArgumentList "http 3000"
Write-Host "ngrok iniciado! Verifique a URL em: http://localhost:4040" -ForegroundColor Green
```

Execute:
```powershell
.\iniciar-ngrok.ps1
```

Depois acesse `http://localhost:4040` no navegador para ver a URL do túnel.

## 📝 Variáveis de Ambiente

Depois de obter a URL do ngrok, atualize seu `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

Isso fará o sistema usar a URL do ngrok automaticamente!

## ⚠️ Limitações da Versão Gratuita

- URL muda a cada reinício
- Limite de conexões simultâneas
- Pode ter delays ocasionais

**Solução:** Use a versão paga para URL fixa, ou atualize a URL do webhook sempre que reiniciar o ngrok.

## 🎯 Alternativas ao ngrok

Se não quiser usar ngrok, pode usar:

1. **localtunnel** (gratuito, sem cadastro):
   ```bash
   npx localtunnel --port 3000
   ```

2. **cloudflared** (gratuito):
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Deploy em produção** (Vercel, Railway, etc.) - URL fixa e mais estável

## ✅ Verificar se Está Funcionando

1. Envie uma mensagem de teste para o WhatsApp conectado
2. Verifique os logs do servidor Next.js
3. Procure por: `[Webhook whatsapp] Recebido:`

Se aparecer, está funcionando! 🎉
