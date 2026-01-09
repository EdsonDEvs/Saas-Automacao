# Como Funciona - Configuração Simplificada

## 🎯 Visão Geral

Agora o cliente pode configurar WhatsApp, Telegram ou qualquer webhook **diretamente no sistema**, sem precisar mexer no n8n manualmente!

## 📋 Fluxo Simplificado

### 1. Cliente Acessa a Página de Configuração
- Vai em **"Configurar"** no menu (ou `/setup`)
- Vê um assistente passo a passo

### 2. Escolhe a Plataforma
- **WhatsApp** - Para usar com Evolution API, Twilio, etc.
- **Telegram** - Para criar um bot do Telegram
- **Webhook Genérico** - Para qualquer sistema

### 3. Preenche os Dados
- **WhatsApp**: URL da API, API Key, Nome da Instância, Número
- **Telegram**: Token do Bot (obtido no @BotFather)
- **Webhook**: Apenas salva (gera URL automaticamente)

### 4. Recebe a URL do Webhook
- O sistema gera automaticamente: `https://seu-dominio.com/api/webhook/whatsapp`
- Cliente copia essa URL
- Cola na configuração da plataforma (Evolution API, Telegram, etc.)

### 5. Pronto!
- Quando alguém enviar mensagem → Plataforma envia para nosso webhook
- Nosso sistema busca contexto do agente automaticamente
- Processa a mensagem e retorna resposta
- Plataforma envia resposta ao cliente

## 🔄 Como Funciona Tecnicamente

```
Cliente envia mensagem no WhatsApp
    ↓
Evolution API/Twilio recebe
    ↓
Envia para: https://seu-dominio.com/api/webhook/whatsapp
    ↓
Nosso sistema:
  1. Identifica qual usuário (baseado na integração)
  2. Busca contexto do agente (via /api/v1/context)
  3. Processa mensagem com IA
  4. Retorna resposta
    ↓
Evolution API/Twilio envia resposta ao cliente
```

## 🎨 Interface do Cliente

### Passo 1: Escolher Plataforma
- Cards visuais para escolher WhatsApp, Telegram ou Webhook
- Clique e seleciona

### Passo 2: Configurar
- Formulário simples com campos necessários
- Instruções claras em cada campo
- Links para criar bots (Telegram)

### Passo 3: Copiar Webhook URL
- URL gerada automaticamente
- Botão de copiar com um clique
- Instruções de onde colar

### Passo 4: Concluído
- Confirmação visual
- Links para dashboard e outras páginas

## 💡 Vantagens

✅ **Super Simples** - Cliente não precisa saber programar
✅ **Guiado** - Passo a passo claro
✅ **Automático** - URL gerada automaticamente
✅ **Flexível** - Funciona com qualquer plataforma
✅ **Sem n8n** - Não precisa configurar n8n manualmente (opcional)

## 🔧 Para o Cliente Usar n8n (Opcional)

Se o cliente quiser usar n8n, ainda pode:
1. Baixar os templates da página de Integração
2. Importar no n8n
3. Configurar variáveis de ambiente
4. Usar normalmente

Mas agora tem a opção mais simples também!

## 📝 Exemplo Prático

### Cliente quer configurar WhatsApp:

1. **Acessa `/setup`**
2. **Clica em "WhatsApp"**
3. **Preenche:**
   - URL: `https://api.evolution.com.br`
   - API Key: `sua-chave-aqui`
   - Instância: `minha-loja`
   - Número: `5511999999999`
4. **Clica "Salvar"**
5. **Recebe URL:** `https://seu-dominio.com/api/webhook/whatsapp`
6. **Copia e cola na Evolution API**
7. **Pronto!** Mensagens começam a ser processadas automaticamente

## 🚀 Próximos Passos (Melhorias Futuras)

- [ ] Integração direta com Evolution API (sem precisar colar URL)
- [ ] Dashboard de mensagens recebidas
- [ ] Histórico de conversas
- [ ] Métricas e analytics
- [ ] Múltiplas instâncias por usuário
