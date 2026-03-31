const TOOL_LABELS: Record<string, string> = {
  get_vacancy_rates: 'Fetching vacancy rates',
  get_rental_prices: 'Fetching rental prices',
  get_housing_starts: 'Fetching housing starts',
  get_housing_starts_annual: 'Fetching annual starts',
  get_home_prices: 'Fetching home prices',
  get_mortgage_rates: 'Fetching mortgage rates',
  get_population_data: 'Fetching population data',
  get_immigration_data: 'Fetching immigration data',
  get_kpis: 'Fetching market snapshot',
};

interface Props {
  tools: string[];
}

export function ToolCallIndicator({ tools }: Props) {
  if (tools.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes tci-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .tci-wrap { display: flex; flex-direction: column; gap: 6px; margin: 4px 0; }
        .tci-pill { display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px; border-radius: 20px; border: 1px solid hsla(38, 95%, 52%, 0.25); background: hsla(38, 95%, 52%, 0.07); font-size: 0.75rem; color: hsl(38, 95%, 65%); }
        .tci-dot { width: 6px; height: 6px; border-radius: 50%; background: hsl(38, 95%, 55%); animation: tci-pulse 1.2s ease-in-out infinite; }
      `}</style>
      <div className="tci-wrap">
        {tools.map((tool) => (
          <span key={tool} className="tci-pill">
            <span className="tci-dot" />
            {TOOL_LABELS[tool] ?? tool}…
          </span>
        ))}
      </div>
    </>
  );
}
