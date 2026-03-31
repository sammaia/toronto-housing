import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DataSource } from '@/services/api';

function SyncBadge({ status, lastSyncedAt }: { status: DataSource['lastSyncStatus']; lastSyncedAt: string | null }) {
  if (status === 'manual') {
    return <Badge variant="outline" className="text-muted-foreground">Atualização manual</Badge>;
  }
  if (status === 'pending') {
    return <Badge variant="outline" className="text-muted-foreground">Aguardando sincronização</Badge>;
  }
  if (status === 'failed') {
    const lastSuccess = lastSyncedAt
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(lastSyncedAt))
      : null;
    return (
      <Badge variant="destructive" className="text-xs">
        {lastSuccess ? `Falha — último sucesso: ${lastSuccess}` : 'Falha na última sincronização'}
      </Badge>
    );
  }
  // success
  const date = lastSyncedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(lastSyncedAt))
    : '—';
  return (
    <Badge
      className="text-xs font-medium"
      style={{ background: 'hsl(142, 76%, 36%)', color: 'white' }}
    >
      Atualizado em {date}
    </Badge>
  );
}

interface DataSourceCardProps {
  source: DataSource;
}

export function DataSourceCard({ source }: DataSourceCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-tight">{source.name}</CardTitle>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Visit source: ${source.name}`}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 flex-1">
        <p className="text-xs text-muted-foreground leading-relaxed">{source.description}</p>
        <div className="mt-auto">
          <SyncBadge status={source.lastSyncStatus} lastSyncedAt={source.lastSyncedAt} />
        </div>
      </CardContent>
    </Card>
  );
}
