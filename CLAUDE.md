# Toronto Housing Insights

## Project Overview
Web dashboard displaying Canadian housing market data from CMHC (Canada Mortgage and Housing Corporation) with an AI chat feature for natural language questions about the data.

## Stack
- **Backend:** NestJS + Prisma + PostgreSQL (Neon)
- **Frontend:** React + TypeScript + Recharts
- **AI:** Anthropic Claude API
- **Data:** CMHC public CSV data (vacancy rates, rental prices, housing starts)
- **Monorepo:** Backend and frontend live in this repo (`/backend`, `/frontend`)

## V1 MVP Scope
- REST API: endpoints for vacancy rates, rental prices, housing starts (Toronto/Ontario focus)
- Data ingestion: script to seed CMHC CSV data into PostgreSQL
- React dashboard with 3 charts (one per data category)
- AI chat panel: user asks natural language questions about housing data
- No authentication required

### Out of Scope (V1)
Maps, auth, mobile, multi-city comparison

## Development Guidelines
- Language: TypeScript everywhere (strict mode)
- Backend runs on port 3001, frontend on port 3000
- API prefix: `/api/v1`
- Use Prisma for all database access — no raw SQL unless necessary
- Environment variables in `.env` (never committed)
- Keep components small and focused
- Use conventional commits (feat:, fix:, chore:, docs:)

## Project Structure
```
toronto-housing/
├── backend/          # NestJS API
│   ├── prisma/       # Schema + migrations + seed
│   ├── src/
│   │   ├── modules/  # Feature modules (vacancy, rental, housing-starts, chat)
│   │   └── common/   # Shared utilities, filters, interceptors
│   └── data/         # Raw CMHC CSV files
├── frontend/         # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/ # API client
│   └── public/
└── CLAUDE.md
```

## Key Commands
```bash
# Backend
cd backend && npm run start:dev      # Dev server
cd backend && npx prisma migrate dev # Run migrations
cd backend && npx prisma db seed     # Seed data
cd backend && npm test               # Tests

# Frontend
cd frontend && npm run dev           # Dev server
cd frontend && npm test              # Tests
```

## Database
- Provider: PostgreSQL (Neon serverless)
- Main tables: vacancy_rates, rental_prices, housing_starts
- All tables include year, geography (city/province), and relevant metrics
