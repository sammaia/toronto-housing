---
name: architecture
description: App structure, auth flow, routing, layout, and protected routes
type: project
---

**Directory layout:**
- `src/contexts/AuthContext.tsx` — AuthProvider + useAuth hook. Auto-restores session via getProfile() on mount. login/register/logout methods.
- `src/components/layout/AppLayout.tsx` — Outlet wrapper with Sidebar + Header
- `src/components/layout/Sidebar.tsx` — Collapsible dark sidebar, NavLinks with active styling, user avatar + logout dropdown
- `src/components/layout/Header.tsx` — Top bar showing page title + breadcrumb based on pathname
- `src/pages/` — LoginPage, RegisterPage, DashboardPage, TrendsPage, MarketPage
- `src/components/charts/` — chartTheme.ts, ChartTooltip.tsx (shared across all pages)

**Routing (App.tsx):** BrowserRouter in main.tsx. ProtectedRoute wraps AppLayout — redirects to /login if not authenticated, shows spinner while isLoading. Routes: /login, /register, / (dashboard), /trends, /market.

**Auth token:** Stored in localStorage as `auth_token`. Attached via axios request interceptor in api.ts.

**Sidebar collapse:** Local state, toggle button at top-right edge. Nav items use NavLink with `end` prop on `/` to prevent always-active. Disabled items rendered as `<div>` with opacity-40.
