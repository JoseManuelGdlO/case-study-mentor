import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, GraduationCap, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

const Profile = () => {
  const { isFreeUser, plan } = useUser();
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(true);

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
            </div>
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

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" /> Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">El cambio de contraseña estará disponible próximamente.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} className="gradient-primary border-0 font-semibold gap-2 px-8">
          <Save className="w-4 h-4" /> Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default Profile;
