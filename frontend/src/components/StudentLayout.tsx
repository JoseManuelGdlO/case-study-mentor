import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import OnboardingTour from '@/components/OnboardingTour';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, BarChart3, User, LogOut, Plus, Crown, Headphones } from 'lucide-react';
import logoConLetra from '@/assets/logotipoconletra.png';
import logoSolo from '@/assets/logotiposolo.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Mis Exámenes', url: '/dashboard/exams', icon: FileText },
  { title: 'Estadísticas', url: '/dashboard/stats', icon: BarChart3 },
  { title: 'Suscripción', url: '/dashboard/subscription', icon: Crown, highlight: true },
  { title: 'Soporte', url: '/dashboard/soporte', icon: Headphones },
  { title: 'Perfil', url: '/dashboard/profile', icon: User },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const { isFreeUser, isFreeTrialExhausted } = useUser();
  const { logout } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-3 min-h-[3.25rem]">
          {collapsed ? (
            <img
              src={logoSolo}
              alt="ENARMX"
              className="h-9 w-9 object-contain flex-shrink-0"
            />
          ) : (
            <img
              src={logoConLetra}
              alt="ENARMX"
              className="h-9 w-auto max-w-[148px] object-left object-contain"
            />
          )}
        </div>

        {!collapsed && (
          <div className="px-4 mb-2" data-tour="new-exam">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block w-full">
                  <Button
                    className="w-full gradient-primary border-0 font-semibold gap-2"
                    onClick={() =>
                      isFreeTrialExhausted ? navigate('/dashboard/subscription') : navigate('/dashboard/new-exam')
                    }
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Examen
                  </Button>
                </span>
              </TooltipTrigger>
              {isFreeTrialExhausted && (
                <TooltipContent side="right" className="max-w-xs">
                  Ya usaste los 2 exámenes de prueba. Suscríbete para crear más exámenes.
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className={`hover:bg-sidebar-accent/50 text-sidebar-foreground ${item.highlight && isFreeUser ? 'text-warning' : ''}`}
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      data-tour={item.url === '/dashboard' ? 'dashboard' : item.url === '/dashboard/exams' ? 'exams' : item.url === '/dashboard/stats' ? 'stats' : item.url === '/dashboard/subscription' ? 'subscription' : undefined}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.highlight && isFreeUser && (
                            <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px] px-1.5 py-0">PRO</Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="hover:bg-sidebar-accent/50 text-sidebar-foreground/60 cursor-pointer"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {!collapsed && <span>Cerrar sesión</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

const StudentLayout = () => {
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('onboarding-completed')) {
      const t = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const completeTour = () => {
    setShowTour(false);
    localStorage.setItem('onboarding-completed', 'true');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <ImpersonationBanner />
          <header className="h-14 flex items-center border-b border-border px-4 bg-background">
            <SidebarTrigger className="mr-4" />
            <div className="ml-auto flex items-center gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {(user?.firstName?.[0] ?? 'U') + (user?.lastName?.[0] ?? '')}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {showTour && <OnboardingTour onComplete={completeTour} />}
    </SidebarProvider>
  );
};

export default StudentLayout;
