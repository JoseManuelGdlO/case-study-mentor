import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: object) => void;
        };
      };
    };
  }
}

const Login = () => {
  const navigate = useNavigate();
  const { user, loading, login, register, googleLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !googleBtnRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const { isNewUser } = await googleLogin(response.credential);
            toast.success(isNewUser ? 'Cuenta creada' : 'Bienvenido');
            navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Error con Google');
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
        locale: 'es',
      });
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [clientId, googleLogin, navigate]);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const { isNewUser } = await register({ email, password, firstName, lastName });
        toast.success('Cuenta creada');
        navigate(isNewUser ? '/onboarding' : '/dashboard', { replace: true });
      } else {
        await login(email, password);
        toast.success('Bienvenido');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width: `${Math.random() * 200 + 50}px`,
                height: `${Math.random() * 200 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-8">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">ENARM Prep</h1>
          <p className="text-xl text-white/80 mb-6">
            Tu plataforma de preparación para el Examen Nacional de Residencias Médicas
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl gradient-primary mb-4">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gradient">ENARM Prep</h1>
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {isRegister ? 'Crear cuenta' : 'Bienvenido de vuelta'}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {isRegister ? 'Comienza tu preparación hoy' : 'Continúa tu preparación'}
                </p>
              </div>

              {clientId ? (
                <div className="mb-6 flex justify-center [&>div]:w-full">
                  <div ref={googleBtnRef} className="w-full min-h-[44px]" />
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground mb-6">
                  Configura VITE_GOOGLE_CLIENT_ID para iniciar sesión con Google.
                </p>
              )}

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">o con email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="fn">Nombre</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fn"
                          className="pl-10 h-12"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ln">Apellido</Label>
                      <Input
                        id="ln"
                        className="h-12"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="pl-10 pr-10 h-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold gradient-primary border-0">
                  {isRegister ? 'Crear cuenta y continuar' : 'Iniciar sesión'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-primary font-semibold hover:underline"
                >
                  {isRegister ? 'Inicia sesión' : 'Regístrate gratis'}
                </button>
              </p>

              <div className="mt-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => navigate('/backoffice')}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Acceso Editores / Backoffice →
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
