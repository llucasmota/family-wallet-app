# 👛 Family Wallet v2 — Arquitetura Técnica & Guia Completo

Family Wallet é uma plataforma moderna e inteligente para gestão financeira familiar e compartilhada, projetada com foco em alta usabilidade, isolamento seguro por grupos, divisões personalizadas de despesas, previsibilidade de parcelamentos, versionamento temporal de recorrências e um assistente multimodal com inteligência artificial agnóstica.

---

## 🏛️ 1. Visão Geral da Arquitetura

```
family-wallet-app/
├── src/
│   ├── app/                      # Next.js 15+ App Router
│   │   ├── [locale]/             # Internacionalização nativa (PT-BR e EN)
│   │   │   ├── layout.tsx        # Layout raiz com ThemeProvider e i18n
│   │   │   ├── page.tsx          # Dashboard Principal (Métricas, Gráficos, Extrato)
│   │   │   ├── expenses/page.tsx # Gestão detalhada de despesas e filtros
│   │   │   └── family/page.tsx   # Gestão do grupo familiar, membros e acerto de contas
│   │   └── api/
│   │       └── agent/route.ts    # Endpoint do Agente Multimodal
│   ├── components/
│   │   ├── agent/                # Assistente IA (Voz, Comprovantes, Texto)
│   │   ├── dashboard/            # Gráficos interativos (Recharts) e lançamentos
│   │   ├── layout/               # Top AppBar Material Design 3 e Navegação
│   │   ├── providers/            # ThemeProvider (Dark / Light)
│   │   └── ui/                   # Design System M3 (Button, Card, Badge, Avatar, MetricCard)
│   ├── db/
│   │   ├── schema.ts             # Schema Relacional Drizzle ORM (Multi-tenancy, Splits, Parcelas)
│   │   └── index.ts              # Conexão PostgreSQL (Supabase / Neon / Local)
│   ├── locales/                  # Dicionários de tradução (pt-BR.json, en.json)
│   ├── services/
│   │   ├── ai/                   # Agente Agnóstico (ILLMProvider, Gemini 2.0 Flash)
│   │   └── expense-calculator.ts # Motor matemático de divisões, parcelamentos e tendências
│   └── styles/
│       └── globals.css           # Tokens de Design Material 3 (Verde Menta / Pastéis / Dark)
├── drizzle.config.ts             # Configuração do Drizzle Kit
├── vitest.config.ts              # Configuração de Testes Unitários
└── package.json
```

---

## 📊 2. Modelo de Dados & Integridade Financeira

O banco relacional (**PostgreSQL**) gerenciado via **Drizzle ORM** garante:
1. **Multi-tenancy por Família (`families`)**: Cada grupo possui seu próprio espaço isolado (`family_id`).
2. **Divisão de Contas (`expense_splits`)**: Registro determinístico de quem pagou (`payer_member_id`) e como o valor foi rateado (`percentage` e `computed_amount`), viabilizando o cálculo exato de compensação entre membros.
3. **Parcelamentos (`installment_series`)**: Lançamentos em $N$ vezes criam projeções no banco de dados com suas datas de vencimento futuras para máxima previsibilidade.
4. **Recorrências Versionadas (`recurrence_templates`)**: Despesas fixas (como aluguel e assinaturas) possuem `effective_from` e `effective_until`. Modificar um valor futuro nunca corrompe o histórico dos meses passados.

---

## 🤖 3. Arquitetura do Agente de IA Agnóstico

O assistente de IA implementa o **Adapter Pattern** através da interface `ILLMProvider`:
- **Multimodal**: Aceita texto livre, áudio de voz e fotos de cupons fiscais/comprovantes PIX.
- **Agnóstico**: O provedor padrão utiliza **Gemini 2.0 Flash** (altíssima velocidade e custo zero/mínimo), mas pode ser substituído por OpenAI, Claude ou Ollama sem alterar o código de negócio.
- **Preparado para Canais Externos**: A lógica reside em `AgentService`, pronta para ser plugada em webhooks do Telegram ou WhatsApp.

---

## 🚀 4. Como Executar o Projeto

### Pré-requisitos
- Node.js 20+ (ou Node com suporte nativo a TypeScript)
- Conta no [Supabase](https://supabase.com) (ou banco PostgreSQL local)

### Instalação e Execução
```bash
# 1. Acesse a pasta do novo projeto
cd /Users/lucasmota/Developer/family-wallet-app

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha a DATABASE_URL com a URI do seu banco Supabase

# 4. Envie as tabelas para o banco de dados
npm run db:push

# 5. Execute os testes unitários
npm run test

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para interagir com a aplicação.
