import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthUser } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import logoConLetra from '@/assets/logotipoconletra.png';

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

function hasBackofficeAccess(u: AuthUser) {
  return u.roles.includes('admin') || u.roles.includes('editor');
}

function destinationAfterBackofficeAuth(location: Location): string {
  const state = location.state as { from?: { pathname?: string } } | null;
  const fromPath = state?.from?.pathname;
  if (
    fromPath &&
    fromPath.startsWith('/backoffice') &&
    fromPath !== '/backoffice/login'
  ) {
    return fromPath;
  }
  return '/backoffice/cases';
}

const BackofficeLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const { user, loading, login, googleLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const goAfterSuccessfulStaffAuth = useCallback(
    (u: AuthUser) => {
      if (hasBackofficeAccess(u)) {
        navigate(destinationAfterBackofficeAuth(locationRef.current), { replace: true });
      } else {
        toast.message('Esta cuenta no tiene acceso al panel de editores');
        navigate('/dashboard', { replace: true });
      }
    },
    [navigate],
  );

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
            const { isNewUser, user: u } = await googleLogin(response.credential);
            toast.success(isNewUser ? 'Cuenta creada' : 'Bienvenido');
            if (isNewUser) {
              navigate('/onboarding', { replace: true });
              return;
            }
            goAfterSuccessfulStaffAuth(u);
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
  }, [clientId, googleLogin, navigate, goAfterSuccessfulStaffAuth]);

  if (!loading && user) {
    if (hasBackofficeAccess(user)) {
      const state = location.state as { from?: { pathname?: string } } | null;
      const fromPath = state?.from?.pathname;
      if (
        fromPath &&
        fromPath.startsWith('/backoffice') &&
        fromPath !== '/backoffice/login'
      ) {
        return <Navigate to={fromPath} replace />;
      }
      return <Navigate to="/backoffice/cases" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const u = await login(email, password);
      toast.success('Bienvenido');
      goAfterSuccessfulStaffAuth(u);
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
          <div className="inline-block rounded-2xl bg-white/95 p-6 mb-8 shadow-lg">
            <img
              src={logoConLetra}
              alt="ENARMX — preparación ENARM"
              className="h-16 sm:h-20 w-auto max-w-[280px] mx-auto object-contain"
            />
          </div>
          <p className="text-xl text-white/90 mb-2">Panel de editores</p>
          <p className="text-white/80 text-sm">Acceso para administración de contenido</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img
              src={logoConLetra}
              alt="ENARMX"
              className="h-12 w-auto max-w-[220px] mx-auto object-contain"
            />
          </div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Acceso editores</h2>
                <p className="text-muted-foreground mt-1">Inicia sesión para el backoffice</p>
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
                <div className="space-y-2">
                  <Label htmlFor="bo-email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bo-email"
                      type="email"
                      className="pl-10 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bo-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bo-password"
                      type={showPassword ? 'text' : 'password'}
                      className="pl-10 pr-10 h-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="current-password"
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
                <div className="text-right -mt-1">
                  <Link
                    to="/recuperar-contrasena"
                    className="text-sm text-primary font-medium hover:underline underline-offset-2"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold gradient-primary border-0">
                  Entrar al backoffice
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                ¿Eres estudiante?{' '}
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  Acceso estudiantes
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BackofficeLogin;
