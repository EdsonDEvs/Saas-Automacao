# 🖥️ Como Configurar seu Servidor Evolution API

## 📋 Visão Geral

Agora você pode ter seu próprio servidor Evolution API e os clientes podem escanear o QR Code **diretamente no sistema**, sem precisar acessar a Evolution API separadamente!

## 🚀 Passo 1: Instalar Evolution API no Servidor

### Opção A: Docker (Recomendado)

```bash
# Crie um arquivo docker-compose.yml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - DATABASE_ENABLED=true
      - DATABASE_CONNECTION_URI=postgresql://user:password@db:5432/evolution
      - REDIS_ENABLED=true
      - REDIS_URI=redis://redis:6379
      - CONFIG_SESSION_PHONE_CLIENT=Chrome
      - CONFIG_SESSION_PHONE_NAME=Chrome
      - SERVER_URL=http://localhost:8080
      - API_KEY=SUA_API_KEY_AQUI
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

  db:
    image: postgres:15
    container_name: evolution-db
    restart: always
    environment:
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=senha_forte_aqui
      - POSTGRES_DB=evolution
    volumes:
      - evolution_db:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: evolution-redis
    restart: always

volumes:
  evolution_instances:
  evolution_store:
  evolution_db:
```

**Execute:**
```bash
docker-compose up -d
```

### Opção B: Instalação Manual

Siga a documentação oficial: https://doc.evolution-api.com

## 🔑 Passo 2: Configurar API Key

1. Acesse seu servidor Evolution API: `http://seu-servidor:8080`
2. Vá em **Settings** → **API Keys**
3. Crie uma nova API Key ou use a padrão
4. **Anote essa chave** - você vai precisar dela

## 🌐 Passo 3: Configurar URL Pública

Se seu servidor estiver em um servidor local, você precisa expor ele publicamente:

### Opção A: Usar ngrok (para testes)
```bash
ngrok http 8080
```
Use a URL fornecida pelo ngrok (ex: `https://abc123.ngrok.io`)

### Opção B: Configurar domínio (produção)
1. Configure um domínio apontando para seu servidor
2. Use HTTPS (recomendado)
3. Exemplo: `https://evolution.seu-dominio.com`

## ⚙️ Passo 4: Configurar no Sistema

No arquivo `.env.local` do seu projeto SaaS, adicione:

```env
# URL base do seu servidor Evolution API
EVOLUTION_API_URL=https://evolution.seu-dominio.com

# API Key do servidor (opcional - pode ser configurada por cliente)
EVOLUTION_API_KEY=sua-api-key-aqui
```

## 🎯 Como Funciona para o Cliente

### 1. Cliente Acessa `/setup`
- Escolhe "WhatsApp"
- Preenche:
  - **URL da Evolution API**: `https://evolution.seu-dominio.com`
  - **API Key**: A chave que você forneceu
  - **Nome da Instância**: Escolhe um nome (ex: `minha-loja`)

### 2. Sistema Cria Instância Automaticamente
- O sistema chama a API do seu servidor
- Cria uma instância única para o cliente
- Gera o QR Code

### 3. Cliente Escaneia QR Code
- QR Code aparece **diretamente na tela**
- Cliente escaneia com WhatsApp
- Sistema verifica automaticamente a cada 3 segundos

### 4. Webhook Configurado Automaticamente
- Quando conecta, o sistema configura o webhook automaticamente
- URL: `https://seu-saas.com/api/webhook/whatsapp`
- Cliente não precisa fazer nada!

## 🔒 Segurança

### Recomendações:

1. **Use HTTPS** - Sempre use HTTPS em produção
2. **API Key Forte** - Use uma API Key complexa
3. **Rate Limiting** - Configure rate limiting no servidor
4. **Firewall** - Restrinja acesso ao servidor Evolution API
5. **Backup** - Faça backup regular das instâncias

## 📊 Múltiplos Clientes

Cada cliente terá sua própria instância:
- **Instância única por cliente**
- **Isolamento completo**
- **Cada cliente escaneia seu próprio QR Code**

## 🛠️ Manutenção

### Ver Instâncias Ativas
```bash
curl -X GET "https://evolution.seu-dominio.com/instance/fetchInstances" \
  -H "apikey: sua-api-key"
```

### Deletar Instância
```bash
curl -X DELETE "https://evolution.seu-dominio.com/instance/delete/nome-instancia" \
  -H "apikey: sua-api-key"
```

### Ver Logs
```bash
docker logs evolution-api -f
```

## 🆘 Troubleshooting

### "Erro ao criar instância"
- Verifique se a API Key está correta
- Verifique se o servidor está acessível
- Verifique os logs do servidor

### "QR Code não aparece"
- Verifique se a instância foi criada
- Tente buscar QR Code novamente
- Verifique logs da Evolution API

### "Webhook não funciona"
- Verifique se a URL do webhook está acessível publicamente
- Verifique se o servidor Evolution API pode acessar sua URL
- Teste com curl ou Postman

## 📝 Exemplo Completo

### 1. Servidor Evolution API rodando em:
```
https://evolution.meuservidor.com
```

### 2. API Key:
```
abc123xyz789
```

### 3. Cliente configura:
- URL: `https://evolution.meuservidor.com`
- API Key: `abc123xyz789`
- Instância: `loja-do-joao`

### 4. Sistema cria automaticamente:
- Instância `loja-do-joao` no servidor
- Gera QR Code
- Cliente escaneia
- Webhook configurado automaticamente

### 5. Pronto! 🎉
- Mensagens chegam em: `https://seu-saas.com/api/webhook/whatsapp`
- Sistema processa automaticamente
- Responde usando o agente IA do cliente

## 💡 Dicas

- **Use um servidor dedicado** para Evolution API
- **Configure monitoramento** (Uptime, logs, etc.)
- **Faça backups regulares** das instâncias
- **Documente** a API Key e guarde em local seguro
- **Teste** antes de colocar em produção
