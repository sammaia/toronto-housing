---
name: chart-theme
description: Chart color palette, dark Recharts axis/grid props, and tooltip component
type: project
---

Theme constants live at `src/components/charts/chartTheme.ts`.

**COLOR_SEQUENCE** (ordered array, use by index for multi-series):
0: #3b82f6 (blue), 1: #06b6d4 (cyan), 2: #8b5cf6 (violet), 3: #10b981 (emerald), 4: #f59e0b (amber), 5: #f43f5e (rose)

**Named map** `CHART_COLORS`: blue, cyan, violet, emerald, amber, rose, indigo, teal.

**Shared Recharts props:**
- `darkAxisProps` — tick fill, axis/tick line stroke matching dark theme
- `darkGridProps` — strokeDasharray, dark stroke, vertical: false

**Tooltip:** `DarkTooltip` at `src/components/charts/ChartTooltip.tsx`. Accepts `formatter?: (value, name) => string`. Pass as `content={<DarkTooltip formatter={...} />}` on Recharts `<Tooltip>`.

**Area fill pattern:** Use `${COLOR}33` for 20% opacity fill on AreaChart (hex alpha suffix).
