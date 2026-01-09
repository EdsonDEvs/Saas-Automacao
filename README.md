# SaaS Automação - AI Automation Manager

SaaS para gestão de atendentes IA onde proprietários de negócios podem registrar, gerenciar seu catálogo de produtos, definir a persona do seu Agente IA e obter um endpoint de API para conectar com n8n/Typebot.

## 🚀 Tecnologias

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS + Shadcn/UI
- **Icons:** Lucide React
- **Backend/Auth/DB:** Supabase (PostgreSQL, Auth, Row Level Security)
- **State Management:** React Query (TanStack Query)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Variáveis de ambiente configuradas

## 🔧 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente no arquivo `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Execute as migrações SQL no Supabase (veja `supabase/migrations/`)

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📁 Estrutura do Projeto

- `/app` - Páginas e rotas (App Router)
- `/components` - Componentes reutilizáveis
- `/lib` - Utilitários e configurações
- `/supabase` - Migrações SQL

## 🔐 Funcionalidades

- ✅ Autenticação (Login/Signup)
- ✅ Dashboard com status do agente
- ✅ Configuração de persona do agente
- ✅ Gerenciamento de produtos (CRUD)
- ✅ Geração e gerenciamento de API Keys
- ✅ Endpoint API `/api/v1/context` para integração com n8n/Typebot
- ✅ **Templates n8n prontos para download** - Fluxos pré-configurados para WhatsApp, Telegram e uso genérico

## 📦 Templates n8n

O projeto inclui templates de fluxos prontos para o n8n que podem ser baixados e importados diretamente:

- **Fluxo Simples Genérico** - Template básico que funciona com qualquer plataforma
- **Fluxo Básico WhatsApp** - Integração com WhatsApp via webhook
- **Fluxo Completo Telegram** - Fluxo completo com comandos e tratamento de mensagens

Os templates estão disponíveis em `/public/n8n-templates/` e podem ser baixados diretamente da página de Integração no sistema.

### Como usar os templates:

1. Acesse a página **Integração** no sistema
2. Baixe o template desejado
3. No n8n, importe o arquivo JSON
4. Configure as variáveis de ambiente (API_ENDPOINT e API_KEY)
5. Configure as credenciais necessárias (OpenAI, WhatsApp, Telegram)
6. Ative o workflow e comece a usar!

## 📝 Licença

MIT
