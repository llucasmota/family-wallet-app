# 🌿 Family Wallet

> **Intelligent, collaborative family financial management powered by Multimodal AI (Gemini 2.0 Flash) and Material Design 3.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![Gemini 2.0](https://img.shields.io/badge/Google-Gemini_2.0_Flash-8E75FF?style=flat-square&logo=google)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-M3_Design-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

🌐 **Languages / Idiomas**: [🇺🇸 English](./README.md) | [🇧🇷 Português](./README.pt-BR.md)

---

## 📖 Overview

**Family Wallet** is a production-grade web and Progressive Web App (PWA) designed to eliminate friction in household financial management. It empowers spouses and family members to track shared and individual expenses, manage installment schedules, view real-time category budgets, and settle net mutual debts with zero manual spreadsheets.

### 🌟 Key Highlights

- **🤖 Multimodal AI Agent (Gemini 2.0 Flash)**: Voice-to-expense speech recognition, receipt image OCR scanner, and natural language text processing with smart Brazilian Portuguese currency parsing.
- **⚡ Automated Net Debt Settlement**: Graph-based debt simplification matrix with full support for pre-existing initial starting credits and 1-click debt settlement.
- **🎨 Material Design 3 & Dark Theme**: Premium M3 design system with elevated dark surfaces, ambient neon glow on hover, and strict accessibility compliance.
- **📅 Time-Travel Navigation**: Browse past and upcoming months with instant dynamic recalculation of metrics, budgets, and pending bills.
- **📊 Real-time Category Budgets & Alerts**: Visual progress bars per category with intelligent due date warning badges (*Due in 2 days*, *Due Today*, *Overdue*).
- **🔒 Enterprise-Grade Security**: Supabase Auth SSR with encrypted sessions, email confirmation flow, and PKCE-based password recovery.
- **📱 PWA Ready**: Installable on iOS Safari and Android Chrome with standalone app experience.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    Client["Client PWA / Browser (Next.js 15 App Router)"]
    Auth["Supabase Auth (SSR Cookies & PKCE)"]
    API["Next.js Server Actions & Route Handlers"]
    Gemini["Google Gemini 2.0 Flash Multimodal AI"]
    Drizzle["Drizzle ORM (Type-Safe Query Layer)"]
    DB[("Supabase PostgreSQL Database")]

    Client -->|User Interaction| API
    Client -->|Session Auth| Auth
    API -->|Prompt & OCR Extraction| Gemini
    API -->|CRUD Operations| Drizzle
    Drizzle -->|SQL Transactions| DB
```

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions, React 19) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Database & Auth** | Supabase (PostgreSQL 15 + Supabase Auth SSR) |
| **ORM** | Drizzle ORM (schema migrations & type safety) |
| **AI / Multimodal** | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| **Styling** | Vanilla Tailwind CSS with custom Material Design 3 Design Tokens |
| **Internationalization** | `next-intl` (Portuguese & English support) |
| **Testing** | Vitest (12+ Unit Tests) & Playwright (E2E Test Suite) |
| **Deployment** | Vercel Serverless Edge Platform |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.17.0` or higher
- **npm** or **pnpm**
- A free **Supabase** account ([supabase.com](https://supabase.com))
- (Optional) A free **Google AI Studio** API key ([aistudio.google.com](https://aistudio.google.com))

### 2. Installation

Clone the repository and install dependencies:
```bash
git clone https://github.com/llucasmota/family-wallet.git
cd family-wallet
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:
```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Google Gemini AI (Optional for AI Agent OCR and Voice)
GEMINI_API_KEY="AIzaSy..."

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup & Migrations

Run database migrations to initialize tables and initial family data:
```bash
npx drizzle-kit push
```

### 5. Running the Application

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Code Quality

Family Wallet includes automated unit and end-to-end tests:

```bash
# Run TypeScript Typecheck
npm run typecheck

# Run Vitest Unit Tests (Financial calculations, NLP parser, settlements)
npm run test

# Run Playwright End-to-End Tests
npm run e2e
```

---

## 📂 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── [locale]/             # Localized routes (pt-BR, en)
│   │   ├── page.tsx          # Real-time Financial Dashboard
│   │   ├── expenses/         # Expenses ledger with CSV export
│   │   ├── family/           # Family members & settlement matrix
│   │   ├── categories/       # Category & budget management
│   │   ├── auth/             # Login, signup, and password recovery
│   │   └── join/[familyId]/  # Family onboarding invitation
│   ├── actions/              # Next.js Server Actions (CRUD, Auth, Settlements)
│   └── api/                  # Route handlers (Agent API, Auth Callbacks)
├── components/               # UI & Feature Components
│   ├── agent/                # Multimodal AI Agent modal & voice recorder
│   ├── dashboard/            # Metrics cards, charts, budgets, and quick add
│   ├── layout/               # Navbar, User Menu, and theme controls
│   └── ui/                   # Reusable M3 primitives (Card, Button, Avatar, MonthPicker)
├── db/                       # Database layer
│   ├── index.ts              # PostgreSQL connection client
│   └── schema.ts             # Drizzle ORM schema definitions
└── services/                 # Core business logic
    ├── ai/                   # Gemini 2.0 Flash & Smart NLP fallback engines
    ├── expense-calculator.ts # Mathematical splits, debt simplification & trends
    └── expense-service.ts    # Aggregated dashboard metrics & transactional operations
```

---

## 📄 License

This project is licensed under the MIT License.
