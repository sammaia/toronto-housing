import { useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

interface Crumb {
  label: string;
  path: string;
}

const ROUTE_META: Record<string, { title: string; crumbs: Crumb[] }> = {
  '/': {
    title: 'Dashboard',
    crumbs: [{ label: 'Dashboard', path: '/' }],
  },
  '/trends': {
    title: 'Trends',
    crumbs: [
      { label: 'Dashboard', path: '/' },
      { label: 'Trends', path: '/trends' },
    ],
  },
  '/market': {
    title: 'Market',
    crumbs: [
      { label: 'Dashboard', path: '/' },
      { label: 'Market', path: '/market' },
    ],
  },
};

export function Header() {
  const { pathname } = useLocation();
  const meta = ROUTE_META[pathname] ?? {
    title: 'Toronto Housing',
    crumbs: [{ label: 'Dashboard', path: '/' }],
  };

  return (
    <header className="h-[65px] flex items-center border-b border-border px-6 gap-4 bg-background shrink-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {meta.crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-2">
            {i > 0 && <span className="text-border">/</span>}
            {i === meta.crumbs.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <span>{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
      <Separator orientation="vertical" className="h-5" />
      <h1 className="text-sm font-semibold text-foreground">{meta.title}</h1>
    </header>
  );
}
