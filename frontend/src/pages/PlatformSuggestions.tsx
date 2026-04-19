import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Inbox, Loader2 } from 'lucide-react';
import { PLATFORM_SUGGESTION_MAX_CHARS, PLATFORM_SUGGESTION_MIN_CHARS } from '@/constants/platform-suggestion';

const PlatformSuggestions = () => {
  const { user, refreshUser } = useAuth();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const impersonating = !!user?.impersonation;

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
        body: JSON.stringify({ message: trimmed, source: 'mailbox' }),
      });
      toast.success('¡Gracias! Hemos recibido tu sugerencia.');
      setMessage('');
      await refreshUser();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="w-7 h-7 text-primary" />
          Buzón de sugerencias
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ideas, comentarios o críticas para mejorar ENARMX. Léelas con calma: las usamos para priorizar el roadmap.
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Tu mensaje</CardTitle>
          <CardDescription>
            Cuéntanos qué echo de menos, qué te frustraría o qué te encantaría encontrar en la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {impersonating ? (
            <p className="text-sm text-muted-foreground">
              No puedes enviar sugerencias mientras un administrador visualiza tu cuenta.
            </p>
          ) : (
            <>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ej.: integración con calendario, más filtros en estadísticas, recordatorios…"
                maxLength={PLATFORM_SUGGESTION_MAX_CHARS}
                rows={8}
                className="resize-none min-h-[160px]"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Entre {PLATFORM_SUGGESTION_MIN_CHARS} y {PLATFORM_SUGGESTION_MAX_CHARS} caracteres.
              </p>
              <Button
                className="gradient-primary border-0"
                onClick={() => void submit()}
                disabled={submitting || message.trim().length < PLATFORM_SUGGESTION_MIN_CHARS}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  'Enviar sugerencia'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformSuggestions;
