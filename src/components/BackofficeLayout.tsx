import { Outlet, useNavigate } from 'react-router-dom';
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
import { LayoutDashboard, FileText, FolderTree, Users, CreditCard, BarChart3, Sparkles, GraduationCap, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Dashboard', url: '/backoffice', icon: LayoutDashboard },
  { title: 'Casos Clínicos', url: '/backoffice/cases', icon: FileText },
  { title: 'Especialidades', url: '/backoffice/specialties', icon: FolderTree },
  { title: 'Usuarios', url: '/backoffice/users', icon: Users },
  { title: 'Precios', url: '/backoffice/pricing', icon: CreditCard },
  { title: 'Frases', url: '/backoffice/phrases', icon: Sparkles },
  { title: 'Estadísticas', url: '/backoffice/stats', icon: BarChart3 },
];

function BackofficeSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-lg text-sidebar-foreground block leading-tight">ENARM Prep</span>
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
              {navItems.map((item) => (
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
              <SidebarMenuButton asChild>
                <NavLink to="/login" className="hover:bg-sidebar-accent/50 text-sidebar-foreground/60" activeClassName="">
                  <LogOut className="mr-2 h-4 w-4" />
                  {!collapsed && <span>Cerrar sesión</span>}
                </NavLink>
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
