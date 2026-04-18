import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import logoConLetra from '@/assets/logotipoconletra.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const json = await apiJson<{ data: { message: string } }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage(json.data.message);
      setDone(true);
      toast.success('Solicitud enviada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img
              src={logoConLetra}
              alt="ENARMX"
              className="h-12 w-auto max-w-[220px] mx-auto object-contain"
            />
          </Link>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-foreground text-center mb-1">Recuperar contraseña</h1>
            <p className="text-muted-foreground text-sm text-center mb-6">
              Te enviaremos instrucciones al correo si está registrado.
            </p>

            {done ? (
              <p className="text-sm text-foreground text-center leading-relaxed">{message}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fp-email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fp-email"
                      type="email"
                      className="pl-10 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold gradient-primary border-0"
                  disabled={loading}
                >
                  {loading ? 'Enviando…' : 'Enviar instrucciones'}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link to="/" className="text-primary font-semibold hover:underline">
                Volver al inicio de sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
