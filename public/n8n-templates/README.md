# Templates de Fluxos n8n - SaaS Automação

Esta pasta contém templates de fluxos prontos para uso no n8n que se integram com o SaaS Automação.

## 📦 Templates Disponíveis

### 1. Fluxo Básico WhatsApp (`fluxo-basico-whatsapp.json`)
Fluxo simples para integração com WhatsApp que:
- Recebe mensagens via Webhook
- Busca contexto do agente e produtos
- Gera resposta usando IA
- Envia resposta ao cliente

### 2. Fluxo Completo Telegram (`fluxo-completo-telegram.json`)
Fluxo completo para Telegram que:
- Recebe mensagens do Telegram
- Trata comandos especiais (/start)
- Busca contexto do agente
- Gera respostas inteligentes
- Envia mensagens de volta

## 🚀 Como Usar

### Passo 1: Importar o Template

1. Abra o n8n
2. Clique em **"Workflows"** no menu lateral
3. Clique no botão **"Import"** (ou use `Ctrl+I`)
4. Selecione o arquivo JSON do template desejado
5. O fluxo será importado automaticamente

### Passo 2: Configurar Variáveis de Ambiente

No n8n, configure as seguintes variáveis de ambiente:

```bash
API_ENDPOINT=https://seu-dominio.com/api/v1/context
API_KEY=sua-api-key-aqui
```

**Como configurar:**
1. No n8n, vá em **Settings** → **Environment Variables**
2. Adicione as variáveis acima
3. Substitua pelos seus valores reais

### Passo 3: Configurar Credenciais

#### Para WhatsApp:
- Configure as credenciais do WhatsApp Business API no n8n
- Ou use um serviço como Twilio, Evolution API, etc.

#### Para Telegram:
- Crie um bot no [@BotFather](https://t.me/botfather)
- Obtenha o token do bot
- Configure no n8n: **Credentials** → **Telegram**

#### Para OpenAI:
- Obtenha sua API Key em [OpenAI Platform](https://platform.openai.com)
- Configure no n8n: **Credentials** → **OpenAI**

### Passo 4: Ajustar URLs e Endpoints

1. Abra o nó **"Buscar Contexto do Agente"** (ou similar)
2. Atualize a URL para seu endpoint real:
   ```
   https://seu-dominio.com/api/v1/context
   ```
3. Configure o header `x-api-key` com sua API Key

### Passo 5: Testar o Fluxo

1. Ative o workflow no n8n
2. Envie uma mensagem de teste
3. Verifique se a resposta é gerada corretamente

## 🔧 Personalização

### Adicionar Mais Funcionalidades

Você pode estender os templates adicionando:
- **Salvamento de conversas** em banco de dados
- **Análise de sentimento** das mensagens
- **Integração com CRM** para salvar leads
- **Notificações** para o dono do negócio
- **Agendamento** de serviços/produtos

### Modificar o Prompt do Agente

O prompt do agente é buscado automaticamente da API. Para personalizar:
1. Acesse o SaaS Automação
2. Vá em **Agente** → **Configuração do Agente**
3. Edite o campo **"Regras de Negócio / Contexto"**
4. Salve as alterações

## 📝 Notas Importantes

- Os templates são apenas exemplos e podem precisar de ajustes
- Certifique-se de ter todas as credenciais configuradas
- Teste em ambiente de desenvolvimento antes de usar em produção
- Monitore os custos da API de IA (OpenAI, etc.)

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs do n8n
2. Confirme que a API Key está correta
3. Verifique se o endpoint está acessível
4. Confirme que todas as credenciais estão configuradas

## 📄 Licença

Estes templates são fornecidos como exemplo e podem ser modificados livremente.
