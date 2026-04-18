import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/" state={{ from: loc }} replace />;
  }
  return <>{children}</>;
}

export function BackofficeRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/backoffice/login" state={{ from: loc }} replace />;
  }
  const ok = user.roles.includes('admin') || user.roles.includes('editor');
  if (!ok) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export function PaidRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/" state={{ from: loc }} replace />;
  }
  if ((user.plan ?? 'free') === 'free') {
    return <Navigate to="/dashboard/subscription" replace />;
  }
  return <>{children}</>;
}

export function AdminRoute({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/backoffice/login" state={{ from: loc }} replace />;
  }
  if (!user.roles.includes('admin')) {
    return <>{fallback ?? <Navigate to="/backoffice/cases" replace />}</>;
  }
  return <>{children}</>;
}
