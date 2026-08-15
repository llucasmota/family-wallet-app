# 🌿 Family Wallet

> **Gestão financeira familiar colaborativa e inteligente impulsionada por IA Multimodal (Gemini 2.0 Flash) e Material Design 3.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![Gemini 2.0](https://img.shields.io/badge/Google-Gemini_2.0_Flash-8E75FF?style=flat-square&logo=google)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-M3_Design-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

🌐 **Idiomas / Languages**: [🇧🇷 Português](./README.pt-BR.md) | [🇺🇸 English](./README.md)

---

## 📖 Visão Geral

O **Family Wallet** é uma aplicação web e Progressive Web App (PWA) de nível de produção criada para eliminar o atrito e as planilhas manuais na gestão financeira do casal e da família. Permite acompanhar despesas compartilhadas e individuais, gerenciar compras parceladas, monitorar metas por categoria em tempo real e calcular o acerto líquido de contas entre os membros com apenas 1 clique.

### 🌟 Principais Recursos

- **🤖 Agente IA Multimodal (Gemini 2.0 Flash)**: Lançamento por comando de voz no navegador, leitura e OCR de fotos de cupons/recibos fiscais e processamento de texto livre com interpretação de linguagem natural e valores em Real (BRL).
- **⚡ Acerto de Contas Automatizado (Matriz Líquida)**: Simplificação matemática de dívidas mútuas com suporte a créditos/saldos pré-existentes trazidos de meses anteriores e liquidação instantânea.
- **🎨 Material Design 3 & Tema Escuro**: Design refinado com superfícies elevadas, iluminação neon sutil sob os cards ao passar o mouse e conformidade com padrões de acessibilidade.
- **📅 Navegação Temporal (Seletor de Mês/Ano)**: Navegue entre meses passados e futuros com recálculo imediato de gráficos, extrato e metas.
- **📊 Metas por Categoria & Alertas de Vencimento**: Barras de progresso semânticas e badges inteligentes de vencimento (*Vence em 2 dias*, *Vence Hoje*, *Vencida*).
- **🔒 Segurança com Supabase Auth**: Sessões SSR seguras via cookies, confirmação de e-mail e recuperação de senha com fluxo PKCE.
- **📱 Pronto como PWA**: Instalável diretamente no Safari (iOS) e Chrome (Android) como aplicativo nativo na tela de início.

---

## 🏗️ Arquitetura & Tecnologias

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions, React 19) |
| **Linguagem** | TypeScript 5 (Strict Mode) |
| **Banco & Auth** | Supabase (PostgreSQL 15 + Supabase Auth SSR) |
| **ORM** | Drizzle ORM (migrações de schema e type-safety) |
| **IA Multimodal** | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| **Estilização** | Tailwind CSS com Tokens customizados do Material Design 3 |
| **Internacionalização** | `next-intl` (suporte a Português e Inglês) |
| **Testes** | Vitest (12+ Testes Unitários) e Playwright (Testes E2E) |
| **Hospedagem** | Plataforma Serverless Vercel Edge |

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- **Node.js**: `v18.17.0` ou superior
- **npm** ou **pnpm**
- Conta no **Supabase** ([supabase.com](https://supabase.com))
- (Opcional) Chave de API no **Google AI Studio** ([aistudio.google.com](https://aistudio.google.com))

### 2. Instalação

Clone o repositório e instale as dependências:
```bash
git clone https://github.com/llucasmota/family-wallet.git
cd family-wallet
npm install
```

### 3. Configuração de Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz:
```env
# Conexão com o Banco de Dados (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Google Gemini AI (Para Modo Agente com OCR e Voz)
GEMINI_API_KEY="AIzaSy..."

# URL da Aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Migrações do Banco de Dados

Aplique o schema e as tabelas iniciais no PostgreSQL:
```bash
npx drizzle-kit push
```

### 5. Iniciando a Aplicação

Execute o servidor local de desenvolvimento:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🧪 Testes Automatizados

```bash
# Verificação de Tipagem TypeScript
npm run typecheck

# Testes Unitários com Vitest (Cálculos de divisão, matriz de acertos, fallback NLP)
npm run test

# Testes de Ponta a Ponta com Playwright
npm run e2e
```

---

## 📄 Licença

Distribuído sob a licença MIT.
