import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
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
import { LayoutDashboard, FileText, FolderTree, Users, CreditCard, BarChart3, Sparkles, CalendarClock, LogOut, Plus, MessageSquareText, BookOpen, ClipboardCheck, Bell, TicketPercent, UserPlus, MessageSquareHeart, Handshake } from 'lucide-react';
import logoConLetra from '@/assets/logotipoconletra.png';
import logoSolo from '@/assets/logotiposolo.png';
import { Button } from '@/components/ui/button';

const navItems: {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}[] = [
  { title: 'Dashboard', url: '/backoffice', icon: LayoutDashboard, adminOnly: true },
  { title: 'Casos Clínicos', url: '/backoffice/cases', icon: FileText },
  { title: 'Especialidades', url: '/backoffice/specialties', icon: FolderTree },
  { title: 'Usuarios', url: '/backoffice/users', icon: Users, adminOnly: true },
  { title: 'Feedback examenes', url: '/backoffice/exam-student-feedback', icon: MessageSquareHeart, adminOnly: true },
  { title: 'Cancelaciones', url: '/backoffice/subscription-cancellation-feedback', icon: MessageSquareText, adminOnly: true },
  { title: 'Avisos (push / correo)', url: '/backoffice/admin-notifications', icon: Bell, adminOnly: true },
  { title: 'Precios', url: '/backoffice/pricing', icon: CreditCard, adminOnly: true },
  { title: 'Códigos de promoción', url: '/backoffice/promotion-codes', icon: TicketPercent, adminOnly: true },
  { title: 'Colaboradores', url: '/backoffice/collaborator-codes', icon: UserPlus, adminOnly: true },
  { title: 'Frases', url: '/backoffice/phrases', icon: Sparkles },
  { title: 'Flashcards', url: '/backoffice/flashcards', icon: BookOpen },
  { title: 'Fechas ENARM', url: '/backoffice/exam-dates', icon: CalendarClock },
  { title: 'Revisiones examenes', url: '/backoffice/exam-reviews', icon: ClipboardCheck },
  { title: 'Mentorías', url: '/backoffice/mentorship', icon: Handshake },
  { title: 'Estadísticas', url: '/backoffice/stats', icon: BarChart3, adminOnly: true },
];

function BackofficeSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-3 min-h-[3.25rem]">
          {collapsed ? (
            <img src={logoSolo} alt="ENARMX" className="h-9 w-9 object-contain flex-shrink-0" />
          ) : (
            <div className="flex flex-col gap-0.5 min-w-0">
              <img
                src={logoConLetra}
                alt="ENARMX"
                className="h-8 w-auto max-w-[160px] object-left object-contain"
              />
              <span className="text-xs text-sidebar-foreground/60">Backoffice</span>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 mb-2">
            <Button className="w-full gradient-primary border-0 font-semibold gap-2" onClick={() => navigate('/backoffice/cases/new')}>
              <Plus className="w-4 h-4" /> Nuevo Caso
            </Button>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50 text-sidebar-foreground" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
                  navigate('/');
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

const BackofficeLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <BackofficeSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b border-border px-4 bg-background">
          <SidebarTrigger className="mr-4" />
          <span className="text-sm font-medium text-muted-foreground">Panel de Editores</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default BackofficeLayout;
