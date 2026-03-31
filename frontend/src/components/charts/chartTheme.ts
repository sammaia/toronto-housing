/** Shared color palette and Recharts style constants for dark-themed charts */

export const CHART_COLORS = {
  blue: '#3b82f6',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  indigo: '#6366f1',
  teal: '#14b8a6',
} as const;

/** Ordered palette for multi-series charts.
 *  [0] amber  — primary series (Toronto CMA, brand colour)
 *  [1] blue   — secondary series (Ontario, comparison)
 *  [2] cyan   — tertiary
 *  [3] violet — quaternary
 *  [4] emerald — quinary
 *  [5] rose   — senary / negative indicators
 */
export const COLOR_SEQUENCE = [
  CHART_COLORS.amber,
  CHART_COLORS.blue,
  CHART_COLORS.cyan,
  CHART_COLORS.violet,
  CHART_COLORS.emerald,
  CHART_COLORS.rose,
] as const;

export const CHART_STYLE = {
  gridColor: 'hsl(216 34% 17%)',
  axisColor: 'hsl(215.4 16.3% 40%)',
  tooltipBg: 'hsl(224 71% 6%)',
  tooltipBorder: 'hsl(216 34% 17%)',
  tooltipText: 'hsl(213 31% 91%)',
  fontSize: 12,
} as const;

/** Common props for XAxis in dark charts */
export const darkAxisProps = {
  tick: { fill: CHART_STYLE.axisColor, fontSize: CHART_STYLE.fontSize },
  axisLine: { stroke: CHART_STYLE.gridColor },
  tickLine: { stroke: CHART_STYLE.gridColor },
} as const;

/** Common props for CartesianGrid in dark charts */
export const darkGridProps = {
  strokeDasharray: '3 3',
  stroke: CHART_STYLE.gridColor,
  vertical: false,
} as const;
