import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/contexts/UserContext';
import { User, Mail, GraduationCap, Calendar, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { isFreeUser, subscription } = useUser();
  const [name, setName] = useState('Dr. Carlos Mendoza');
  const [email, setEmail] = useState('carlos.mendoza@email.com');
  const [university, setUniversity] = useState('Universidad Nacional Autónoma de México');
  const [graduationYear, setGraduationYear] = useState('2024');
  const [specialty, setSpecialty] = useState('Medicina General');

  const handleSave = () => {
    toast.success('Perfil actualizado correctamente');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Administra tu información personal</p>
      </div>

      {/* Avatar & Status */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold flex-shrink-0">
            {name.split(' ').filter((_, i) => i === 0 || i === 1).map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            <p className="text-muted-foreground text-sm">{email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={isFreeUser ? 'bg-muted text-muted-foreground' : 'gradient-primary text-primary-foreground border-0'}>
                {isFreeUser ? 'Plan Gratuito' : `Plan ${subscription?.plan === 'monthly' ? 'Mensual' : subscription?.plan === 'semester' ? 'Semestral' : 'Anual'}`}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
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
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Info */}
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
              <Label htmlFor="specialty">Especialidad deseada</Label>
              <Input id="specialty" placeholder="Ej: Cardiología" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" /> Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contraseña actual</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
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
