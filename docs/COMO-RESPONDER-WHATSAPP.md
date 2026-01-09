# 💬 Como Funciona o Sistema de Respostas no WhatsApp

## 🔄 Fluxo Completo

```
Cliente envia mensagem no WhatsApp
    ↓
Evolution API recebe a mensagem
    ↓
Envia para: https://seu-dominio.com/api/webhook/whatsapp
    ↓
Nosso sistema:
  1. Identifica qual cliente (pela instância)
  2. Busca contexto do agente (produtos, regras, etc.)
  3. Processa mensagem com IA (OpenAI)
  4. Gera resposta personalizada
  5. Envia resposta de volta via Evolution API
    ↓
Evolution API envia resposta ao cliente
    ↓
Cliente recebe resposta no WhatsApp
```

## ⚙️ Configuração Necessária

### 1. Configurar OpenAI (Opcional mas Recomendado)

Adicione no arquivo `.env.local`:

```env
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

**Como obter:**
1. Acesse: https://platform.openai.com
2. Crie uma conta ou faça login
3. Vá em **API Keys**
4. Crie uma nova chave
5. Copie e cole no `.env.local`

**Nota:** Se não configurar, o sistema ainda funciona mas retorna respostas simples.

### 2. Configurar Webhook na Evolution API

O webhook já é configurado automaticamente quando você conecta o WhatsApp, mas você pode verificar:

1. Acesse seu servidor Evolution API
2. Vá em **Settings** → **Webhooks**
3. Verifique se está configurado: `https://seu-dominio.com/api/webhook/whatsapp`

## 🎯 Como Funciona

### Passo 1: Cliente Envia Mensagem
```
Cliente: "Olá, vocês têm corte de cabelo?"
```

### Passo 2: Evolution API Recebe
- Evolution API recebe a mensagem
- Envia para nosso webhook configurado

### Passo 3: Sistema Processa
- Identifica qual cliente (pela instância)
- Busca configuração do agente:
  - Nome: "Julia"
  - Persona: "Você é uma assistente de salão..."
  - Produtos: "Corte (R$ 35), Barba (R$ 20)..."
- Processa com IA usando o contexto

### Passo 4: IA Gera Resposta
```
IA: "Olá! Sim, temos corte de cabelo disponível por R$ 35. 
Gostaria de agendar um horário?"
```

### Passo 5: Sistema Envia Resposta
- Envia de volta via Evolution API
- Cliente recebe no WhatsApp

## 🔧 Personalização

### Ajustar Respostas da IA

1. **Acesse** `/agent` no sistema
2. **Edite** o campo "Regras de Negócio / Contexto"
3. **Adicione** instruções específicas:
   ```
   Você é Julia, assistente do Salão Barn.
   - Sempre seja amigável e prestativa
   - Quando perguntarem sobre preços, mencione os valores
   - Se perguntarem sobre horários, ofereça agendamento
   - Use emojis moderadamente
   ```
4. **Salve** - As mudanças são aplicadas automaticamente

### Ajustar Tom de Voz

No mesmo lugar, escolha:
- **Formal** - Linguagem mais profissional
- **Friendly** - Linguagem amigável (padrão)
- **Sales** - Foco em vendas

## 📊 Exemplo Prático

### Mensagem do Cliente:
```
"Quanto custa um corte?"
```

### Sistema Busca:
- **Agente:** Julia
- **Persona:** "Você é uma assistente de salão..."
- **Produtos:** "Corte (R$ 35): Corte moderno..."

### IA Processa:
```
System: "Você é Julia, assistente do Salão Barn. 
Inventário: Corte (R$ 35): Corte moderno..."

User: "Quanto custa um corte?"
```

### Resposta Gerada:
```
"Olá! O corte custa R$ 35. Gostaria de agendar? 😊"
```

### Cliente Recebe:
```
[WhatsApp]
Julia: Olá! O corte custa R$ 35. Gostaria de agendar? 😊
```

## 🆘 Troubleshooting

### Mensagens não estão sendo respondidas

1. **Verifique se o webhook está configurado:**
   - Acesse Evolution API → Settings → Webhooks
   - Deve ter: `https://seu-dominio.com/api/webhook/whatsapp`

2. **Verifique logs:**
   - No servidor, veja os logs do Next.js
   - Procure por erros no console

3. **Teste o webhook:**
   ```bash
   curl -X POST https://seu-dominio.com/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"text":{"body":"teste"},"key":{"remoteJid":"5511999999999@s.whatsapp.net"}}'
   ```

### Respostas não estão chegando

1. **Verifique Evolution API:**
   - Teste enviar mensagem manualmente
   - Verifique se a instância está conectada

2. **Verifique OpenAI:**
   - Se não configurou, respostas serão simples
   - Configure `OPENAI_API_KEY` para usar IA completa

3. **Verifique logs:**
   - Console do servidor mostra erros
   - Verifique se há problemas de autenticação

## 💡 Dicas

### Melhorar Respostas da IA

1. **Seja específico** nas regras de negócio
2. **Inclua exemplos** de como responder
3. **Mencione produtos** no contexto
4. **Defina tom** apropriado

### Monitorar Conversas

- Logs do servidor mostram todas as mensagens
- Você pode adicionar dashboard de mensagens (futuro)

### Testar Localmente

Use ngrok para testar:
```bash
ngrok http 3000
```
Use a URL do ngrok no webhook da Evolution API.

## 🚀 Próximos Passos (Melhorias Futuras)

- [ ] Dashboard de mensagens recebidas
- [ ] Histórico de conversas
- [ ] Métricas e analytics
- [ ] Múltiplos modelos de IA (GPT-4, Claude, etc.)
- [ ] Respostas com imagens
- [ ] Agendamento automático
