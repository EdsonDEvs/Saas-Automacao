# 📱 Como Configurar as APIs - Guia Completo

## 🟢 WhatsApp - Evolution API (Recomendado)

### O que é Evolution API?
A Evolution API é uma solução brasileira popular para conectar WhatsApp Business. É gratuita e fácil de usar.

### Como Configurar:

#### 1. Instalar Evolution API
Você tem duas opções:

**Opção A: Usar serviço hospedado (mais fácil)**
- Use um serviço como: https://evolution-api.com
- Ou hospede você mesmo seguindo: https://doc.evolution-api.com

**Opção B: Docker (recomendado para produção)**
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e DATABASE_ENABLED=true \
  -e DATABASE_CONNECTION_URI="postgresql://..." \
  atendai/evolution-api:latest
```

#### 2. Criar uma Instância
1. Acesse a Evolution API (geralmente em `http://localhost:8080` ou URL do serviço)
2. Vá em **Instances** → **Create Instance**
3. Escolha um nome (ex: `minha-loja`)
4. Escaneie o QR Code com seu WhatsApp
5. Anote o nome da instância

#### 3. Obter API Key
1. Na Evolution API, vá em **Settings** → **API Keys**
2. Crie uma nova API Key
3. Copie a chave gerada

#### 4. Configurar no Sistema
Na página `/setup`, preencha:

- **URL da API**: 
  - Se local: `http://localhost:8080`
  - Se hospedado: `https://sua-evolution-api.com`
  
- **API Key**: Cole a chave que você copiou

- **Nome da Instância**: O nome que você escolheu (ex: `minha-loja`)

- **Número do WhatsApp**: Seu número no formato internacional
  - Exemplo: `5511999999999` (Brasil: 55 + DDD + número)

#### 5. Configurar Webhook
1. Após salvar no sistema, você receberá uma URL como:
   ```
   https://seu-dominio.com/api/webhook/whatsapp
   ```
2. Na Evolution API, vá em **Settings** → **Webhooks**
3. Adicione a URL recebida
4. Salve

---

## 🔵 WhatsApp - Twilio

### O que é Twilio?
Twilio é uma plataforma paga mas muito confiável para WhatsApp Business API oficial.

### Como Configurar:

#### 1. Criar Conta Twilio
1. Acesse: https://www.twilio.com
2. Crie uma conta
3. Verifique seu número de telefone

#### 2. Configurar WhatsApp Sandbox (Teste)
1. No Twilio Console, vá em **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Siga as instruções para conectar seu WhatsApp
3. Anote o número do Sandbox (ex: `whatsapp:+14155238886`)

#### 3. Obter Credenciais
1. No Twilio Console, vá em **Settings** → **API Keys**
2. Crie uma nova API Key
3. Anote:
   - **Account SID**
   - **Auth Token**
   - **API Key SID**
   - **API Key Secret**

#### 4. Configurar no Sistema
Na página `/setup`, preencha:

- **URL da API**: `https://api.twilio.com`

- **API Key**: Use o formato: `AccountSID:AuthToken`
  - Exemplo: `ACxxxxxxxxxxxx:your_auth_token`

- **Nome da Instância**: Deixe vazio ou use `twilio`

- **Número do WhatsApp**: O número do Sandbox ou número verificado
  - Formato: `whatsapp:+5511999999999`

---

## 🟣 Telegram

### Como Configurar:

#### 1. Criar Bot no Telegram
1. Abra o Telegram
2. Procure por **@BotFather**
3. Envie: `/newbot`
4. Escolha um nome para seu bot (ex: "Minha Loja Bot")
5. Escolha um username (deve terminar com "bot", ex: `minha_loja_bot`)
6. **Copie o token** que o BotFather fornecer
   - Formato: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

#### 2. Configurar no Sistema
Na página `/setup`, preencha:

- **Token do Bot**: Cole o token que você copiou do BotFather

#### 3. Configurar Webhook (Automático)
Após salvar, o sistema fornecerá uma URL. Para configurar:

**Opção A: Via comando (mais fácil)**
```bash
curl -F "url=https://seu-dominio.com/api/webhook/telegram" \
  https://api.telegram.org/bot[SEU_TOKEN]/setWebhook
```

**Opção B: Via navegador**
Acesse:
```
https://api.telegram.org/bot[SEU_TOKEN]/setWebhook?url=https://seu-dominio.com/api/webhook/telegram
```

Substitua `[SEU_TOKEN]` pelo token do seu bot.

---

## 📋 Resumo das URLs Comuns

### Evolution API
- **Local**: `http://localhost:8080`
- **Hospedado**: `https://sua-evolution-api.com`
- **Documentação**: https://doc.evolution-api.com

### Twilio
- **URL**: `https://api.twilio.com`
- **Documentação**: https://www.twilio.com/docs/whatsapp

### Telegram
- **URL da API**: `https://api.telegram.org`
- **Não precisa preencher URL** - apenas o token do bot

---

## ❓ Qual Escolher?

### Para Começar (Gratuito):
✅ **Evolution API** - Mais fácil, gratuita, brasileira

### Para Produção (Pago):
✅ **Twilio** - Mais confiável, WhatsApp Business oficial

### Para Testes Rápidos:
✅ **Telegram** - Mais simples, não precisa de número de telefone

---

## 🔧 Exemplo Completo - Evolution API

1. **Instalar Evolution API** (Docker):
   ```bash
   docker run -d --name evolution-api -p 8080:8080 atendai/evolution-api:latest
   ```

2. **Acessar**: `http://localhost:8080`

3. **Criar Instância**: Nome: `minha-loja`

4. **Escanear QR Code** com WhatsApp

5. **Obter API Key**: Settings → API Keys → Criar

6. **No Sistema** (`/setup`):
   - URL: `http://localhost:8080`
   - API Key: `sua-chave-aqui`
   - Instância: `minha-loja`
   - Número: `5511999999999`

7. **Copiar Webhook URL** e colar na Evolution API

8. **Pronto!** 🎉

---

## 🆘 Problemas Comuns

### "Erro ao conectar com Evolution API"
- Verifique se a URL está correta
- Verifique se a Evolution API está rodando
- Teste acessando a URL no navegador

### "API Key inválida"
- Verifique se copiou a chave completa
- Crie uma nova chave na Evolution API

### "Instância não encontrada"
- Verifique se o nome da instância está correto
- Confirme que a instância está ativa na Evolution API

### "Webhook não funciona"
- Verifique se a URL está acessível publicamente
- Use um serviço como ngrok para testar localmente:
  ```bash
  ngrok http 3000
  ```
