import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { DataSourceCard } from '@/components/DataSourceCard';
import { getDataSources } from '@/services/api';
import type { DataSource } from '@/services/api';

export function AboutDataPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDataSources()
      .then(setSources)
      .catch(() => setError('Could not load data sources.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">About the Data</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          All sources used in this dashboard, with sync status and official links.
        </p>
      </div>

      {/* Source cards */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((source) => (
            <DataSourceCard key={source.key} source={source} />
          ))}
        </div>
      )}

      {/* Methodology note */}
      {!loading && !error && (
        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground max-w-2xl">
            Data is automatically synced every Monday at 3 AM. Geographic focus is Toronto CMA and Ontario. Home prices (TRREB) have no free public API and are updated manually.
          </p>
        </div>
      )}
    </div>
  );
}
