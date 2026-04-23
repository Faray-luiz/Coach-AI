# Coach AI - Simi Treinadora 🤖🚀

Plataforma avançada de análise de mentorias baseada em IA, utilizando **Gemini 2.5 Flash**, **RAG (Retrieval-Augmented Generation)** e processamento assíncrono.

## 🌟 Funcionalidades Principais

- **Análise Comportamental**: Diagnóstico profundo de sessões de mentoria (Clareza, Profundidade, Conexão, Eficiência).
- **RAG (Knowledge Base)**: Base de conhecimento dinâmica. A Simi consulta seus manuais (PDF/DOCX/TXT) para dar feedbacks personalizados.
- **Background Jobs (Inngest)**: Processamento de IA escalável em background, evitando timeouts e garantindo alta disponibilidade.
- **Pipeline Robusto**: Sistema de auto-recuperação (retry) e normalização de dados para 100% de confiabilidade no Dashboard.
- **Dashboard Premium**: Visualização de métricas, equilíbrio de fala, "Golden Questions" e "Red Flags".

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15 (App Router)
- **IA**: Google Gemini 2.5 Flash + text-embedding-004
- **Banco de Dados**: Supabase (PostgreSQL + pgvector)
- **Jobs/Workflow**: Inngest
- **Estilização**: Tailwind CSS + Lucide Icons

## 🚀 Guia de Configuração

### 1. Variáveis de Ambiente
Crie um arquivo `.env` com as seguintes chaves:
```env
GEMINI_API_KEY=sua_chave_do_google_ai_studio
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_anon
INNGEST_EVENT_KEY=sua_chave_do_inngest (opcional para local)
```

### 2. Setup do Banco de Dados (Supabase)
Execute os scripts SQL na pasta `/supabase` no editor SQL do Supabase:
1. `rag_setup.sql`: Habilita vetores e base de conhecimento.
2. `sessions_setup.sql`: Cria a tabela de rastreamento de sessões e jobs.

### 3. Rodando Localmente
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`

## 🏗️ Arquitetura do Sistema

### Pipeline de IA (`src/lib/ai`)
O motor principal que orquestra o **Retrieval** (busca no banco), a **Geração** (Gemini) e a **Validação** (Zod).

### RAG Engine
Utiliza busca por similaridade de cosseno via `pgvector` para encontrar o contexto mais relevante em milissegundos.

### Background Workers (`src/inngest`)
Gerencia o ciclo de vida da análise: `Pending` -> `Processing` -> `Completed`. Permite que análises pesadas rodem sem travar a experiência do usuário.

---
Desenvolvido com ❤️ para elevar o nível da mentoria global.
