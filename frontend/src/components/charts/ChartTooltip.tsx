import { CHART_STYLE } from './chartTheme';

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface DarkTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
  formatter?: (value: number, name: string) => string;
}

/** Reusable dark-themed tooltip for all Recharts charts */
export function DarkTooltip({ active, payload, label, formatter }: DarkTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: CHART_STYLE.tooltipBg,
        border: `1px solid ${CHART_STYLE.tooltipBorder}`,
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: CHART_STYLE.tooltipText,
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 6, color: CHART_STYLE.tooltipText }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: '#94a3b8' }}>{entry.name}:</span>
          <span style={{ fontWeight: 500 }}>
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
