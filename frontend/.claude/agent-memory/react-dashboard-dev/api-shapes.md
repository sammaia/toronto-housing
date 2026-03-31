---
name: api-shapes
description: All API endpoints, their function names, and TypeScript interface names in api.ts
type: project
---

All in `src/services/api.ts`. Base URL: `http://localhost:3001/api/v1`.

| Endpoint | Function | Return type |
|---|---|---|
| GET /overview/kpis | getKpis() | KpiData |
| GET /vacancy-rates | getVacancyRates(params?) | VacancyRate[] |
| GET /rental-prices | getRentalPrices(params?) | RentalPrice[] |
| GET /housing-starts/annual | getHousingStartsAnnual(geography?) | HousingStart[] |
| GET /market/home-prices | getHomePrices() | HomePrice[] |
| GET /market/mortgage-rates | getMortgageRates() | MortgageRate[] |
| GET /market/population | getPopulation(region?) | PopulationData[] |
| GET /market/immigration | getImmigration() | ImmigrationData[] |
| POST /auth/register | register({name, email, password}) | AuthResponse |
| POST /auth/login | login({email, password}) | AuthResponse |
| GET /auth/me | getProfile() | AuthUser |

**KpiData fields:** vacancyRate, avgRent2Bed, rentChange, mortgageRate5yr, policyRate, avgDetachedPrice, population, populationGrowth, newPermanentResidents, year

**Token helpers:** setAuthToken(token), clearAuthToken(), getStoredToken() — all use localStorage key `auth_token`.
