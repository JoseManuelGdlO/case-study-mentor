import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, ArrowRight, Stethoscope, Building2 } from 'lucide-react';
import type { Category } from '@/types';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 15 }, (_, i) => String(currentYear - 10 + i));

const Onboarding = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [desiredSpecialty, setDesiredSpecialty] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let c = false;
    apiJson<{ data: Category[] }>('/api/specialties')
      .then((r) => {
        if (!c) setCategories(r.data);
      })
      .catch(() => {
        if (!c) toast.error('No se pudieron cargar especialidades');
      });
    return () => {
      c = true;
    };
  }, []);

  const steps = [
    {
      title: '¿Cómo te llamas?',
      subtitle: 'Queremos personalizar tu experiencia',
      icon: <GraduationCap className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="onb-name">Nombre completo</Label>
            <Input
              id="onb-name"
              placeholder="Dr. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
          </div>
        </div>
      ),
      isValid: name.trim().length >= 3,
    },
    {
      title: '¿Dónde estudiaste?',
      subtitle: 'Cuéntanos sobre tu formación',
      icon: <Building2 className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="onb-uni">Universidad</Label>
            <Input
              id="onb-uni"
              placeholder="Ej: Universidad Nacional Autónoma de México"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="h-12 text-base"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Año de egreso</Label>
            <Select value={graduationYear} onValueChange={setGraduationYear}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecciona el año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      isValid: university.trim().length >= 3 && graduationYear !== '',
    },
    {
      title: '¿Cuál es tu especialidad soñada?',
      subtitle: 'Esto nos ayuda a personalizar tus exámenes',
      icon: <Stethoscope className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setDesiredSpecialty(cat.name)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  desiredSpecialty === cat.name
                    ? 'border-primary bg-accent shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="font-medium text-foreground">{cat.name}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>O escribe otra</Label>
            <Input
              placeholder="Ej: Dermatología"
              value={desiredSpecialty}
              onChange={(e) => setDesiredSpecialty(e.target.value)}
              className="h-12"
            />
          </div>
        </div>
      ),
      isValid: desiredSpecialty.trim().length >= 2,
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = async () => {
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    try {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] ?? '';
      const lastName = parts.slice(1).join(' ') || firstName;
      await apiJson('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName,
          lastName,
          university: university || null,
          graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
        }),
      });
      await apiJson('/api/profile/onboarding', { method: 'PUT' });
      toast.success('¡Bienvenido a ENARMX!', {
        description: `Mucho éxito en tu camino hacia ${desiredSpecialty}, ${firstName}`,
      });
      navigate('/dashboard');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ImpersonationBanner />
      <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'gradient-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground">
                {currentStep.icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{currentStep.title}</h1>
                <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
              </div>
            </div>

            {currentStep.content}

            <div className="flex justify-between mt-8">
              {step > 0 ? (
                <Button variant="ghost" type="button" onClick={() => setStep(step - 1)}>
                  Anterior
                </Button>
              ) : (
                <div />
              )}
              <Button
                type="button"
                disabled={!currentStep.isValid || saving}
                onClick={handleNext}
                className={`gap-2 ${isLast ? 'gradient-primary border-0 font-semibold px-8' : ''}`}
              >
                {isLast ? (saving ? 'Guardando…' : '¡Comenzar!') : 'Siguiente'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Onboarding;
