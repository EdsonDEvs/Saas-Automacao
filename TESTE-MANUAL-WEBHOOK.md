# 🧪 Como Testar Webhook Manualmente - Guia Passo a Passo

## 📋 Informações que você precisa:

Antes de começar, você precisa ter:
1. **URL da Evolution API**: Exemplo: `https://sua-evolution-api.com` ou `http://localhost:8080`
2. **API Key**: A chave de API da Evolution
3. **Nome da Instância**: Exemplo: `minha-empresattt`
4. **URL do Webhook**: `http://localhost:3000/api/webhook/whatsapp` (ou sua URL em produção)

---

## 🔧 Método 1: Usando PowerShell (Windows)

### Passo 1: Abra o PowerShell

Pressione `Win + X` e escolha "Windows PowerShell" ou "Terminal"

### Passo 2: Teste o Formato 1 (Mais Simples)

Cole este comando no PowerShell (substitua os valores):

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = "SUA-API-KEY-AQUI"
}

$body = @{
    webhook = @{
        url = "http://localhost:3000/api/webhook/whatsapp"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://SUA-EVOLUTION-API.com/webhook/set/minha-empresattt" -Method POST -Headers $headers -Body $body
```

**O que observar:**
- ✅ Se retornar `200 OK` ou um objeto JSON → **FUNCIONOU!**
- ❌ Se retornar erro `400` ou `404` → Tente o próximo formato

### Passo 3: Teste o Formato 2 (Com Events)

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = "SUA-API-KEY-AQUI"
}

$body = @{
    webhook = @{
        url = "http://localhost:3000/api/webhook/whatsapp"
        events = @("MESSAGES_UPSERT")
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://SUA-EVOLUTION-API.com/webhook/set/minha-empresattt" -Method POST -Headers $headers -Body $body
```

### Passo 4: Teste o Formato 3 (Completo)

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = "SUA-API-KEY-AQUI"
}

$body = @{
    webhook = @{
        url = "http://localhost:3000/api/webhook/whatsapp"
        webhook_by_events = $false
        webhook_base64 = $false
        events = @("MESSAGES_UPSERT", "MESSAGES_UPDATE")
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://SUA-EVOLUTION-API.com/webhook/set/minha-empresattt" -Method POST -Headers $headers -Body $body
```

### Passo 5: Teste o Formato 4 (Formato Antigo)

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = "SUA-API-KEY-AQUI"
}

$body = @{
    url = "http://localhost:3000/api/webhook/whatsapp"
    webhook_by_events = $false
    events = @("MESSAGES_UPSERT")
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://SUA-EVOLUTION-API.com/webhook/set/minha-empresattt" -Method POST -Headers $headers -Body $body
```

---

## 🌐 Método 2: Usando Postman (Interface Gráfica)

### Passo 1: Baixe o Postman

Se não tiver, baixe em: https://www.postman.com/downloads/

### Passo 2: Crie uma Nova Requisição

1. Abra o Postman
2. Clique em **"New"** → **"HTTP Request"**
3. Configure:
   - **Method**: `POST`
   - **URL**: `https://SUA-EVOLUTION-API.com/webhook/set/minha-empresattt`

### Passo 3: Configure os Headers

Na aba **"Headers"**, adicione:
- **Key**: `Content-Type` | **Value**: `application/json`
- **Key**: `apikey` | **Value**: `SUA-API-KEY-AQUI`

### Passo 4: Configure o Body

1. Vá na aba **"Body"**
2. Selecione **"raw"**
3. Escolha **"JSON"** no dropdown
4. Cole um dos formatos abaixo:

**Formato 1 (Mais Simples):**
```json
{
  "webhook": {
    "url": "http://localhost:3000/api/webhook/whatsapp"
  }
}
```

**Formato 2 (Com Events):**
```json
{
  "webhook": {
    "url": "http://localhost:3000/api/webhook/whatsapp",
    "events": ["MESSAGES_UPSERT"]
  }
}
```

**Formato 3 (Completo):**
```json
{
  "webhook": {
    "url": "http://localhost:3000/api/webhook/whatsapp",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE"]
  }
}
```

**Formato 4 (Antigo):**
```json
{
  "url": "http://localhost:3000/api/webhook/whatsapp",
  "webhook_by_events": false,
  "events": ["MESSAGES_UPSERT"]
}
```

### Passo 5: Envie e Veja a Resposta

1. Clique em **"Send"**
2. Veja a resposta na parte inferior:
   - ✅ **Status 200** = Funcionou!
   - ❌ **Status 400/404** = Tente outro formato

---

## 🖥️ Método 3: Usando curl (Linux/Mac/Git Bash)

Se você tem Git Bash instalado no Windows, pode usar curl também:

```bash
curl -X POST "https://SUA-EVOLUTION-API.com/webhook/set/minha-empresattt" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA-API-KEY-AQUI" \
  -d '{
    "webhook": {
      "url": "http://localhost:3000/api/webhook/whatsapp"
    }
  }'
```

---

## 📝 Como Saber se Funcionou?

### ✅ Resposta de Sucesso:

```json
{
  "status": 200,
  "message": "Webhook configured successfully"
}
```

Ou qualquer resposta com **Status 200 OK**.

### ❌ Resposta de Erro:

```json
{
  "status": 400,
  "error": "Bad Request",
  "response": {
    "message": ["instance requires property \"webhook\""]
  }
}
```

Se aparecer erro, tente o próximo formato.

---

## 🎯 O Que Fazer Depois?

1. **Anote qual formato funcionou** (Formato 1, 2, 3 ou 4)
2. **Copie o JSON exato** que você enviou
3. **Me envie** e eu ajusto o código automaticamente!

---

## 💡 Dica: Onde Encontrar as Informações?

### URL da Evolution API:
- Se você configurou no setup, está em: `/setup`
- Ou verifique o arquivo `.env.local`: `EVOLUTION_API_URL`

### API Key:
- Se você configurou no setup, está em: `/setup`
- Ou verifique o arquivo `.env.local`: `EVOLUTION_API_KEY`

### Nome da Instância:
- No dashboard, veja o card "Status do WhatsApp"
- Ou no console do navegador, veja: `instanceName: "minha-empresattt"`

### URL do Webhook:
- Em desenvolvimento: `http://localhost:3000/api/webhook/whatsapp`
- Em produção: `https://seu-dominio.com/api/webhook/whatsapp`

---

## 🆘 Precisa de Ajuda?

Se nenhum formato funcionar, pode ser que:
1. A Evolution API esteja em uma versão diferente
2. O endpoint seja diferente
3. Precise de autenticação diferente (Bearer token)

Nesse caso, verifique a documentação da sua Evolution API ou me envie os erros que apareceram!
