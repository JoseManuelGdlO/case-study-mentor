import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PLATFORM_SUGGESTION_MAX_CHARS, PLATFORM_SUGGESTION_MIN_CHARS } from '@/constants/platform-suggestion';

type PlatformSuggestionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PlatformSuggestionDialog({ open, onOpenChange }: PlatformSuggestionDialogProps) {
  const { refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        await apiJson('/api/platform-suggestions/prompt-handled', { method: 'POST' });
        if (!cancelled) await refreshUser();
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'No se pudo registrar la vista del aviso');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, refreshUser]);

  useEffect(() => {
    if (!open) setMessage('');
  }, [open]);

  const submit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < PLATFORM_SUGGESTION_MIN_CHARS) {
      toast.error(`Escribe al menos ${PLATFORM_SUGGESTION_MIN_CHARS} caracteres.`);
      return;
    }
    setSubmitting(true);
    try {
      await apiJson('/api/platform-suggestions', {
        method: 'POST',
        body: JSON.stringify({ message: trimmed, source: 'modal' }),
      });
      toast.success('¡Gracias! Tu idea nos ayuda a mejorar ENARMX.');
      await refreshUser();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ayúdanos a mejorar la plataforma</DialogTitle>
          <DialogDescription>
            Tu opinión, crítica o idea cuenta. Es opcional y nos ayuda a priorizar lo que más te importa en ENARMX.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm font-medium">¿Qué te gustaría ver o mejorar?</p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ej.: me gustaría poder filtrar exámenes por tema, o un modo oscuro en estadísticas…"
            maxLength={PLATFORM_SUGGESTION_MAX_CHARS}
            rows={5}
            className="resize-none min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground">
            Mínimo {PLATFORM_SUGGESTION_MIN_CHARS} caracteres. Máximo {PLATFORM_SUGGESTION_MAX_CHARS}.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Ahora no
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
