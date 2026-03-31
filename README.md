# Toronto Housing Insights

A full-stack web dashboard that makes Canadian housing market data explorable — through interactive charts and a conversational AI analyst that queries live CMHC data on demand.

---

## The Problem

CMHC (Canada Mortgage and Housing Corporation) publishes authoritative housing data — vacancy rates, rental prices, housing starts, mortgage rates — but it lives in dense CSV files that require significant effort to interpret. This project ingests that data into a queryable database and adds two layers on top: a visual dashboard for at-a-glance trends, and an AI chat interface that lets you ask plain-English questions and get answers backed by the actual numbers.

---

## Key Features

**Data Dashboard**
- Three interactive charts built with Recharts: vacancy rates by bedroom type, average monthly rent trends, and monthly housing starts by dwelling type
- Data sourced from official CMHC CSVs, ingested via a Prisma seed script into PostgreSQL

**AI Housing Analyst**
- Conversational interface powered by Claude (Anthropic) with real-time token streaming via Server-Sent Events
- Agentic tool loop: before responding, the AI decides which of 9 housing data tools to call, executes them in sequence, then composes an answer grounded in retrieved figures — it never guesses numbers
- Conversation history persisted to PostgreSQL; conversations are auto-titled on first message
- Live tool-call indicators in the UI so users can see which data sources the AI is consulting

**Auth**
- JWT-based authentication with login and registration pages
- All conversations are scoped to the authenticated user; ownership is enforced at the API layer

---

## Architecture

```
Browser
  |
  |-- REST (JSON) --------> NestJS API (:3001)
  |                              |
  |-- SSE stream <-----------    |-- Prisma ORM
                                 |       |
                             PostgreSQL (Neon serverless)
                                 |
                             Anthropic Claude API
                             (streaming + tool use)
```

### Agentic Loop (the interesting part)

When a user sends a message, `ChatService.sendMessage` runs a `while` loop against the Claude streaming API:

1. Stream the model's response, forwarding text tokens to the SSE connection as they arrive
2. If `stop_reason === 'tool_use'`: execute each requested tool via `ToolService.run`, append results to the message history, and loop again
3. If `stop_reason === 'end_turn'`: persist the completed assistant message and close the stream

The AI has access to 9 tools covering: vacancy rates, rental prices, housing starts (monthly + annual), home prices, mortgage rates, population growth, immigration, and a KPI snapshot. The system prompt instructs it to always retrieve data before answering quantitative questions.

```
User message
    |
    v
[Claude stream] --> text tokens --> SSE --> browser
    |
    | stop_reason = tool_use
    v
[ToolService.run()] --> Prisma query --> result
    |
    v
[Append tool_result to messages, loop]
    |
    | stop_reason = end_turn
    v
[Persist to DB, emit done event]
```

### Why SSE Instead of WebSockets

The AI response stream is strictly unidirectional — the server pushes tokens, the client only reads. SSE is simpler to implement for this pattern (standard HTTP, native browser `EventSource` support, no upgrade handshake) and avoids the operational overhead of maintaining persistent bidirectional connections.

### Why Neon Serverless PostgreSQL

Standard managed Postgres has a minimum monthly cost even when idle. Neon's serverless tier scales to zero between requests — appropriate for a portfolio project that isn't receiving constant traffic — while keeping the full Postgres feature set and a real production deployment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeScript (strict) |
| ORM | Prisma |
| Database | PostgreSQL via Neon serverless |
| AI | Anthropic Claude API (streaming + tool use) |
| Frontend | React, TypeScript, Vite |
| Charts | Recharts |
| Auth | JWT (NestJS Guards) |
| Streaming | Server-Sent Events (SSE) |

---

## Database Schema

| Model | Purpose |
|---|---|
| `VacancyRate` | CMHC rental vacancy rates by year, geography, bedroom type |
| `RentalPrice` | Average monthly rent with year-over-year change |
| `HousingStart` | Monthly dwelling starts by type (single, semi, row, apartment) |
| `HomePrice` | Average sale prices by property type |
| `PopulationGrowth` | Annual population and YoY growth rate by region |
| `Immigration` | Permanent and temporary resident arrivals by year |
| `MortgageRate` | 5-yr fixed, variable, and Bank of Canada policy rate by year |
| `Conversation` | AI chat sessions scoped to a user, with auto-generated title |
| `Message` | Individual turns with role, content, and persisted tool call log |
| `User` | Auth users |

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database (or a [Neon](https://neon.tech) free-tier project)

### Backend

```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL and ANTHROPIC_API_KEY
npx prisma migrate dev
npx prisma db seed
npm run start:dev           # API runs on :3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # App runs on :3000
```

---

## Data Source

Housing data is sourced from the **Canada Mortgage and Housing Corporation (CMHC)** public data portal. CMHC is the federal crown corporation responsible for Canada's national housing policy and publishes authoritative rental market surveys, housing starts statistics, and mortgage market data.

Raw CSV files are ingested via `backend/prisma/seed.ts`.

---

## Project Structure

```
toronto-housing/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 10 models
│   │   └── seed.ts             # CSV ingestion script
│   ├── src/
│   │   └── modules/
│   │       ├── auth/           # JWT auth
│   │       ├── chat/           # Agentic loop, SSE streaming, 9 tools
│   │       ├── vacancy/
│   │       ├── rental/
│   │       ├── housing-starts/
│   │       ├── market/
│   │       └── overview/
│   └── data/                   # Raw CMHC CSV files
└── frontend/
    └── src/
        ├── components/
        │   ├── chat/           # ChatMessage, ChatThread, ConversationList,
        │   │                   # MessageInput, ToolCallIndicator
        │   └── charts/         # HousingStartsChart, RentalChart, VacancyChart
        ├── hooks/
        │   └── useChatStream.ts  # SSE client hook
        ├── pages/              # Dashboard, Chat, Market, Trends, Login, Register
        └── services/           # API client
```

---

## Live Demo

_Coming soon — deployment in progress._
