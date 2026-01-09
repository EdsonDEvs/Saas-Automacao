# 💬 Como Funcionam as Respostas Automáticas

## 🎯 Visão Geral

O sistema processa mensagens recebidas e responde automaticamente usando IA, com base na configuração do agente e produtos cadastrados.

## 🔄 Fluxo Completo

```
1. Cliente envia: "Quanto custa um corte?"
   ↓
2. Evolution API recebe e envia para: /api/webhook/whatsapp
   ↓
3. Sistema identifica qual cliente (pela instância)
   ↓
4. Busca contexto do agente:
   - Nome: "Julia"
   - Persona: "Você é uma assistente..."
   - Produtos: "Corte (R$ 35)..."
   ↓
5. Processa com OpenAI (ou resposta simples)
   ↓
6. Gera resposta: "Olá! O corte custa R$ 35. Gostaria de agendar?"
   ↓
7. Envia de volta via Evolution API
   ↓
8. Cliente recebe no WhatsApp
```

## ⚙️ Configuração

### 1. Configurar OpenAI (Opcional)

Adicione no `.env.local`:
```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

**Sem OpenAI:** Sistema funciona mas retorna respostas simples.

**Com OpenAI:** Sistema usa IA completa para gerar respostas inteligentes.

### 2. Configurar Agente

1. Acesse `/agent` no sistema
2. Configure:
   - **Nome:** Ex: "Julia"
   - **Tom:** Formal, Friendly ou Sales
   - **Regras de Negócio:** Instruções detalhadas

### 3. Cadastrar Produtos

1. Acesse `/products`
2. Adicione produtos com:
   - Nome
   - Descrição
   - Preço
   - Status (em estoque)

## 📝 Exemplo Prático

### Configuração do Agente:
```
Nome: Julia
Tom: Friendly
Regras: "Você é Julia, assistente do Salão Barn. 
Sempre seja amigável. Quando perguntarem sobre preços, 
mencione os valores. Ofereça agendamento quando apropriado."
```

### Produtos Cadastrados:
- Corte: R$ 35
- Barba: R$ 20
- Corte + Barba: R$ 50

### Cliente Envia:
```
"Quanto custa um corte?"
```

### Sistema Processa:
1. Busca contexto: Julia + produtos
2. IA gera: "Olá! O corte custa R$ 35. Gostaria de agendar? 😊"
3. Envia via Evolution API

### Cliente Recebe:
```
Julia: Olá! O corte custa R$ 35. Gostaria de agendar? 😊
```

## 🔧 Personalização

### Melhorar Respostas

**Seja específico nas regras:**
```
❌ Ruim: "Seja amigável"
✅ Bom: "Sempre cumprimente. Use o nome do cliente se souber. 
Quando perguntarem sobre preços, liste os valores claramente."
```

**Inclua exemplos:**
```
"Se perguntarem 'quanto custa?', responda: 
'Olá! [Liste produtos e preços]. Gostaria de agendar?'"
```

**Mencione produtos:**
```
"Você tem acesso ao catálogo de produtos. 
Sempre mencione produtos relevantes quando apropriado."
```

## 🆘 Troubleshooting

### Mensagens não são respondidas

1. **Verifique webhook:**
   - Evolution API → Settings → Webhooks
   - Deve ter: `https://seu-dominio.com/api/webhook/whatsapp`

2. **Verifique logs:**
   - Console do servidor mostra erros
   - Procure por "Webhook error"

3. **Teste manualmente:**
   ```bash
   curl -X POST https://seu-dominio.com/api/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{
       "text":{"body":"teste"},
       "key":{"remoteJid":"5511999999999@s.whatsapp.net"},
       "instance":"sua-instancia"
     }'
   ```

### Respostas não chegam

1. **Verifique Evolution API:**
   - Instância está conectada?
   - API Key está correta?

2. **Verifique OpenAI:**
   - Se não configurou, respostas serão simples
   - Configure `OPENAI_API_KEY` para IA completa

3. **Verifique formato:**
   - Número deve estar no formato correto
   - Instância deve existir

## 💡 Dicas

- **Teste localmente** com ngrok
- **Monitore logs** para ver mensagens processadas
- **Ajuste regras** do agente conforme necessário
- **Adicione produtos** para respostas mais completas

## 🚀 Próximos Passos

- Dashboard de mensagens
- Histórico de conversas
- Métricas e analytics
- Múltiplos modelos de IA
