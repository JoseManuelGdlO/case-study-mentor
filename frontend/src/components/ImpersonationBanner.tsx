import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';

export function ImpersonationBanner() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!user?.impersonation) return null;

  const studentLabel = `${user.firstName} ${user.lastName}`.trim() || user.email;

  const handleStop = async () => {
    setBusy(true);
    try {
      await apiJson('/api/auth/impersonate/stop', { method: 'POST' });
      await refreshUser();
      navigate('/backoffice/users');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo salir del modo vista');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="shrink-0 w-full border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm sticky top-0 z-[60]"
      role="status"
    >
      <div className="flex items-center gap-2 min-w-0 text-foreground">
        <Eye className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
        <span className="min-w-0">
          <span className="font-medium">Modo vista:</span>{' '}
          <span className="text-muted-foreground">
            estás viendo el portal como <strong className="text-foreground">{studentLabel}</strong>
            {' · '}
            sesión admin: {user.impersonation.actorEmail}
          </span>
        </span>
      </div>
      <Button type="button" size="sm" variant="secondary" className="shrink-0 gap-1.5" disabled={busy} onClick={() => void handleStop()}>
        <LogOut className="w-3.5 h-3.5" />
        {busy ? 'Saliendo…' : 'Volver a mi cuenta'}
      </Button>
    </div>
  );
}
