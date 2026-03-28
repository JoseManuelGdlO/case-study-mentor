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
import { LayoutDashboard, FileText, BarChart3, User, GraduationCap, LogOut, Plus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Mis Exámenes', url: '/dashboard/exams', icon: FileText },
  { title: 'Estadísticas', url: '/dashboard/stats', icon: BarChart3 },
  { title: 'Suscripción', url: '/dashboard/subscription', icon: Crown, highlight: true },
  { title: 'Perfil', url: '/dashboard/profile', icon: User },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const navigate = useNavigate();
  const { isFreeUser } = useUser();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg text-sidebar-foreground">ENARM Prep</span>}
        </div>

        {!collapsed && (
          <div className="px-4 mb-2">
            <Button
              className="w-full gradient-primary border-0 font-semibold gap-2"
              onClick={() => navigate('/dashboard/new-exam')}
            >
              <Plus className="w-4 h-4" />
              Nuevo Examen
            </Button>
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

const StudentLayout = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 flex items-center border-b border-border px-4 bg-background">
          <SidebarTrigger className="mr-4" />
          <div className="ml-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              JP
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default StudentLayout;
