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

## 📝 Licença

MIT
