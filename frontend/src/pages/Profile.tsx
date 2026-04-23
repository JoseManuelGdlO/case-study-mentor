import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, GraduationCap, Save, Shield, Lock, Eye, EyeOff, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import SubscriptionManagementSection from '@/components/SubscriptionManagementSection';
import { ThemeToggle } from '@/components/ThemeToggle';

const Profile = () => {
  const { isFreeUser, plan } = useUser();
  const { refreshUser, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [confirmPwOpen, setConfirmPwOpen] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const json = await apiJson<{
          data: {
            firstName: string;
            lastName: string;
            email: string;
            university: string | null;
            graduationYear: number | null;
          };
        }>('/api/profile');
        if (c) return;
        const p = json.data;
        setName(`${p.firstName} ${p.lastName}`.trim());
        setEmail(p.email);
        setUniversity(p.university ?? '');
        setGraduationYear(p.graduationYear != null ? String(p.graduationYear) : '');
      } catch {
        if (!c) toast.error('No se pudo cargar el perfil');
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const handleSave = async () => {
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] ?? '';
    const lastName = parts.slice(1).join(' ') || parts[0] || '';
    try {
      await apiJson('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName,
          university: university || null,
          graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
        }),
      });
      await refreshUser();
      toast.success('Perfil actualizado correctamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const openPasswordConfirm = () => {
    if (!currentPassword.trim()) {
      toast.error('Indica tu contraseña actual');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    setConfirmPwOpen(true);
  };

  const submitPasswordChange = async () => {
    setPwSaving(true);
    try {
      await apiJson('/api/profile/password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirm,
        }),
      });
      setConfirmPwOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      await refreshUser();
      toast.success('Contraseña actualizada correctamente');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto p-6 text-muted-foreground">Cargando…</div>;
  }

  const initials = name
    .split(' ')
    .filter((_, i) => i === 0 || i === 1)
    .map((n) => n[0])
    .join('');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal</p>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold flex-shrink-0">
            {initials || '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{name || 'Usuario'}</h2>
            <p className="text-muted-foreground text-sm">{email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={isFreeUser ? 'bg-muted text-muted-foreground' : 'gradient-primary text-primary-foreground border-0'}>
                {isFreeUser ? 'Plan Gratuito' : `Plan ${plan === 'monthly' ? 'Mensual' : plan === 'semester' ? 'Semestral' : 'Anual'}`}
              </Badge>
              {!isFreeUser && user?.subscriptionExpiresAt && (
                <p className="text-xs text-muted-foreground mt-1 w-full">
                  {user?.hasStripeSubscription || user?.hasPayPalSubscription
                    ? 'Próxima renovación o fin de acceso: '
                    : 'Vigente hasta '}
                  {new Date(user.subscriptionExpiresAt).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-primary" /> Apariencia
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Elige tema claro, oscuro o el mismo que tu sistema. Se guarda en este dispositivo.
          </p>
          <div className="flex shrink-0 justify-end">
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" /> Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" className="pl-10" value={email} disabled readOnly />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-primary" /> Información Académica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="university">Universidad</Label>
              <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradYear">Año de egreso</Label>
              <Input id="gradYear" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="specialty">Especialidad deseada (solo referencia local)</Label>
              <Input id="specialty" placeholder="Ej: Cardiología" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <SubscriptionManagementSection />

      {user?.authProvider === 'google' ? (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" /> Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tu cuenta usa Google. La contraseña la gestionas desde tu cuenta de Google; aquí no aplica un
              cambio de contraseña local.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" /> Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Usa tu contraseña actual y escribe la nueva dos veces. Te pediremos confirmación antes de guardar.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cur-pw">Contraseña actual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cur-pw"
                  type={showPw ? 'text' : 'password'}
                  className="pl-10 pr-10"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-pw"
                  type={showPw ? 'text' : 'password'}
                  className="pl-10 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw2">Confirmar nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-pw2"
                  type={showPw ? 'text' : 'password'}
                  className="pl-10"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={openPasswordConfirm}
            >
              Cambiar contraseña
            </Button>

            <AlertDialog open={confirmPwOpen} onOpenChange={setConfirmPwOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Confirmar cambio de contraseña?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Vas a actualizar la contraseña de tu cuenta. ¿Estás seguro de que deseas continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pwSaving}>Cancelar</AlertDialogCancel>
                  <Button
                    type="button"
                    className="gradient-primary border-0"
                    disabled={pwSaving}
                    onClick={() => void submitPasswordChange()}
                  >
                    {pwSaving ? 'Guardando…' : 'Sí, cambiar contraseña'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} className="gradient-primary border-0 font-semibold gap-2 px-8">
          <Save className="w-4 h-4" /> Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default Profile;
