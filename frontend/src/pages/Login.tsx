import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Lock, User, Eye, EyeOff, FileText, BarChart3, BookOpen, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;
  const { user, loading, login, register, googleLogin } = useAuth();

  /** Tras login: ruta protegida que originó el acceso o dashboard */
  const getDestinationAfterAuth = useCallback(() => {
    const state = locationRef.current.state as { from?: { pathname?: string } } | null;
    const fromPath = state?.from?.pathname;
    if (fromPath && fromPath.startsWith('/') && fromPath !== '/login') {
      return fromPath;
    }
    return '/dashboard';
  }, []);

  const [isRegister, setIsRegister] = useState(false);

  const focusRegister = useCallback(() => {
    setIsRegister(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('auth-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, []);
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
            const next = isNewUser ? '/onboarding' : getDestinationAfterAuth();
            navigate(next, { replace: true });
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
  }, [clientId, googleLogin, navigate, getDestinationAfterAuth]);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const { isNewUser } = await register({ email, password, firstName, lastName });
        toast.success('Cuenta creada');
        navigate(isNewUser ? '/onboarding' : getDestinationAfterAuth(), { replace: true });
      } else {
        await login(email, password);
        toast.success('Bienvenido');
        navigate(getDestinationAfterAuth(), { replace: true });
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
        <div className="relative z-10 flex flex-col items-center text-center text-white max-w-lg px-4">
          <div className="inline-block rounded-2xl bg-white/95 p-6 mb-8 shadow-lg">
            <img
              src={logoConLetra}
              alt="ENARMX — preparación ENARM"
              className="h-16 sm:h-20 w-auto max-w-[280px] mx-auto object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Entrena para el ENARM con práctica real
          </h1>
          <p className="text-lg text-white/90 mb-8 max-w-md">
            Simulacros, plan de estudio y estadísticas en un solo lugar. Gratis para empezar; solo te toma un minuto.
          </p>
          <ul className="w-full max-w-md space-y-3 mb-8 text-left">
            <li className="flex gap-3 items-start text-white/95">
              <FileText className="h-5 w-5 shrink-0 mt-0.5 text-white" aria-hidden />
              <span>Exámenes tipo ENARM y repaso por tema desde Mis Exámenes</span>
            </li>
            <li className="flex gap-3 items-start text-white/95">
              <BarChart3 className="h-5 w-5 shrink-0 mt-0.5 text-white" aria-hidden />
              <span>Estadísticas para ver tu avance y enfocar lo que falta</span>
            </li>
            <li className="flex gap-3 items-start text-white/95">
              <BookOpen className="h-5 w-5 shrink-0 mt-0.5 text-white" aria-hidden />
              <span>Plan de estudio con sesiones guiadas día a día</span>
            </li>
            <li className="flex gap-3 items-start text-white/95">
              <Sparkles className="h-5 w-5 shrink-0 mt-0.5 text-white" aria-hidden />
              <span>Crea tu cuenta gratis y continúa en el dashboard</span>
            </li>
          </ul>
          <Button
            type="button"
            size="lg"
            onClick={focusRegister}
            className="w-full max-w-sm h-12 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-lg border-0"
          >
            Crear cuenta gratis
          </Button>
          <p className="mt-6 text-sm text-white/75 max-w-sm">
            ¿Ya estudias con nosotros? Inicia sesión en el formulario de la derecha.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <img
              src={logoConLetra}
              alt="ENARMX"
              className="h-12 w-auto max-w-[220px] mx-auto object-contain"
            />
          </div>

          <div className="lg:hidden mb-6 rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground text-center leading-snug">
              ¿Primera vez aquí? Crea tu cuenta gratis y accede a simulacros, plan de estudio y estadísticas.
            </p>
            <Button type="button" variant="default" className="w-full h-11 font-semibold gradient-primary border-0" onClick={focusRegister}>
              Registrarme gratis
            </Button>
            <p className="text-xs text-center text-muted-foreground">Solo te toma un minuto.</p>
          </div>

          <Card id="auth-panel" className="border-0 shadow-xl scroll-mt-6">
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
                {!isRegister && (
                  <div className="text-right -mt-1">
                    <Link
                      to="/recuperar-contrasena"
                      className="text-sm text-primary font-medium hover:underline underline-offset-2"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                )}
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

              <p className="text-center text-xs text-muted-foreground mt-4">
                <Link to="/terminos" className="underline underline-offset-2 hover:text-primary">
                  Términos y condiciones
                </Link>
                <span className="mx-2">·</span>
                <Link to="/privacidad" className="underline underline-offset-2 hover:text-primary">
                  Política de privacidad
                </Link>
              </p>

              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  to="/backoffice/login"
                  className="block w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Acceso Editores / Backoffice →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
