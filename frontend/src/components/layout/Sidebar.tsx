import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Trends', to: '/trends', icon: TrendingUp },
  { label: 'Market', to: '/market', icon: Building2 },
  { label: 'Sobre os Dados', to: '/about-data', icon: Info },
  { label: 'AI Chat', to: '/chat', icon: MessageSquare, disabled: true },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen border-r border-border bg-[hsl(var(--sidebar-background))] transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border min-h-[65px]">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ background: 'hsl(38, 95%, 52%)', boxShadow: '0 2px 12px hsla(38, 95%, 52%, 0.28)' }}
        >
          <BarChart3 className="w-4 h-4" style={{ color: 'hsl(224, 71%, 8%)' }} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p
              className="whitespace-nowrap leading-tight text-foreground"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400, fontSize: '0.875rem', letterSpacing: '-0.01em' }}
            >
              Toronto Housing
            </p>
            <p
              className="text-muted-foreground whitespace-nowrap"
              style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              Insights
            </p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-16 z-10 flex items-center justify-center w-6 h-6 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (item.disabled) {
            return (
              <div
                key={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm opacity-40 cursor-not-allowed select-none',
                  collapsed ? 'justify-center' : ''
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && (
                  <span className="ml-auto text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    Soon
                  </span>
                )}
              </div>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]'
                    : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-3 w-full rounded-lg px-2 py-2 hover:bg-[hsl(var(--sidebar-accent))] transition-colors',
                  collapsed ? 'justify-center' : ''
                )}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="text-xs" style={{ background: 'hsl(38, 95%, 52%)', color: 'hsl(224, 71%, 8%)', fontWeight: 700 }}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
