import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Category } from '@/types';
import type { ExamMode, ExamLanguage } from '@/types';
import { ArrowLeft, ArrowRight, BookOpen, Timer, CheckCircle2, Lock, Crown, Info } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';

const ENARM_QUESTION_COUNT = 450;
const quickCounts = [10, 50, 100, 200];

type QuestionFilter = 'all' | 'unanswered' | 'answered';

const NewExam = () => {
  const navigate = useNavigate();
  const { isFreeUser, isFreeTrialExhausted, freeTrialExamsRemaining } = useUser();
  const { refreshUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<ExamLanguage>('es');
  const [mode, setMode] = useState<ExamMode>('study');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('all');
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await apiJson<{ data: Category[] }>('/api/specialties');
        if (!cancelled) setCategories(json.data);
      } catch {
        if (!cancelled) toast.error('No se pudieron cargar especialidades');
      } finally {
        if (!cancelled) setLoadingTree(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const on = prev.includes(id);
      const next = on ? prev.filter((c) => c !== id) : [...prev, id];
      if (on) {
        const cat = categories.find((c) => c.id === id);
        const subIds = new Set(cat?.subcategories.map((s) => s.id) ?? []);
        setSelectedSubcategories((subs) => subs.filter((s) => !subIds.has(s)));
      }
      return next;
    });
  };

  const toggleSubcategory = (id: string) => {
    setSelectedSubcategories((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const filteredSubcategories = useMemo(
    () => categories.filter((c) => selectedCategories.includes(c.id)).flatMap((c) => c.subcategories),
    [categories, selectedCategories]
  );

  const steps = useMemo(
    () => [
      {
        title: 'Idioma',
        subtitle: '¿En qué idioma quieres tu examen?',
        content: (
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'es' as ExamLanguage, label: 'Español', flag: '🇲🇽' },
              { value: 'en' as ExamLanguage, label: 'English', flag: '🇺🇸' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLanguage(opt.value)}
                className={`p-6 rounded-xl border-2 text-center transition-all ${language === opt.value ? 'border-primary bg-accent shadow-md' : 'border-border hover:border-primary/50'}`}
              >
                <span className="text-4xl block mb-2">{opt.flag}</span>
                <span className="font-semibold text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>
        ),
      },
      {
        title: 'Modo de examen',
        subtitle: 'Elige cómo quieres practicar',
        content: (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('study')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${mode === 'study' ? 'border-primary bg-accent shadow-md' : 'border-border hover:border-primary/50'}`}
              >
                <BookOpen className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold text-lg text-foreground mb-1">📚 Modo Estudio</h3>
                <p className="text-sm text-muted-foreground">
                  Recibe feedback inmediato en cada pregunta con explicaciones detalladas y bibliografía.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setMode('simulation')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${mode === 'simulation' ? 'border-primary bg-accent shadow-md' : 'border-border hover:border-primary/50'}`}
              >
                <Timer className="w-8 h-8 text-secondary mb-3" />
                <h3 className="font-bold text-lg text-foreground mb-1">🎯 Modo Simulación</h3>
                <p className="text-sm text-muted-foreground">
                  Simula el examen real: sin feedback hasta terminar, con temporizador incluido.
                </p>
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">Modo adaptativo ENARM</p>
                  <p className="text-sm text-muted-foreground">
                    Ajusta la dificultad por tu rendimiento y habilita predicción de percentil/probabilidad.
                  </p>
                </div>
                <Checkbox
                  checked={adaptiveMode}
                  onCheckedChange={(checked) => {
                    if (isFreeUser && checked) {
                      toast.error('El modo adaptativo está disponible con suscripción activa');
                      return;
                    }
                    setAdaptiveMode(Boolean(checked));
                  }}
                />
              </div>
              {isFreeUser && (
                <p className="text-xs text-warning">
                  Disponible en plan de pago. Suscríbete para desbloquear simulador adaptativo.
                </p>
              )}
            </div>
          </>
        ),
      },
      {
        title: 'Especialidades',
        subtitle: 'Selecciona las áreas que deseas practicar',
        content: loadingTree ? (
          <p className="text-muted-foreground text-center py-8">Cargando especialidades…</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay especialidades. Crea datos desde backoffice.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selectedCategories.includes(cat.id) ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}
              >
                <Checkbox checked={selectedCategories.includes(cat.id)} />
                <span className="font-medium text-foreground">{cat.name}</span>
              </button>
            ))}
          </div>
        ),
      },
      {
        title: 'Subcategorías',
        subtitle: 'Personaliza tu examen aún más',
        content:
          filteredSubcategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Selecciona al menos una especialidad en el paso anterior</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSubcategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => toggleSubcategory(sub.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${selectedSubcategories.includes(sub.id) ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'}`}
                >
                  <Checkbox checked={selectedSubcategories.includes(sub.id)} />
                  <span className="text-sm font-medium text-foreground">{sub.name}</span>
                </button>
              ))}
            </div>
          ),
      },
      {
        title: 'Filtro de preguntas',
        subtitle: '¿Qué preguntas quieres incluir?',
        content: (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [
                { value: 'all' as QuestionFilter, label: 'Todas', icon: '📋', desc: 'Incluir todas las preguntas disponibles' },
                { value: 'unanswered' as QuestionFilter, label: 'Sin resolver', icon: '❓', desc: 'Solo preguntas que no has contestado' },
                { value: 'answered' as QuestionFilter, label: 'Ya resueltas', icon: '✅', desc: 'Solo preguntas que ya contestaste' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setQuestionFilter(opt.value)}
                className={`p-5 rounded-xl border-2 text-left transition-all ${questionFilter === opt.value ? 'border-primary bg-accent shadow-md' : 'border-border hover:border-primary/50'}`}
              >
                <span className="text-3xl block mb-2">{opt.icon}</span>
                <h3 className="font-bold text-foreground mb-1">{opt.label}</h3>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        ),
      },
      {
        title: 'Número de preguntas',
        subtitle: '¿Cuántas preguntas quieres contestar?',
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">Recomendación:</span> El ENARM consta de{' '}
                <span className="font-bold text-primary">{ENARM_QUESTION_COUNT} preguntas</span>. Te sugerimos practicar con bloques similares.
              </p>
            </div>
            {isFreeUser && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <Crown className="w-4 h-4 text-warning flex-shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Plan gratuito:</span> puedes crear hasta{' '}
                  <span className="font-semibold">2 exámenes de prueba</span> de hasta{' '}
                  <span className="font-semibold">10 preguntas</span> cada uno.
                  {typeof freeTrialExamsRemaining === 'number' && freeTrialExamsRemaining > 0 && (
                    <>
                      {' '}
                      {freeTrialExamsRemaining === 1
                        ? 'Te queda 1 examen de prueba.'
                        : `Te quedan ${freeTrialExamsRemaining} exámenes de prueba.`}
                    </>
                  )}{' '}
                  <button type="button" onClick={() => navigate('/dashboard/subscription')} className="text-primary font-semibold underline">
                    Suscríbete
                  </button>{' '}
                  para exámenes más largos y sin límite de cantidad.
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {quickCounts.map((count) => {
                const locked = isFreeUser && count > 10;
                return (
                  <Tooltip key={count}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => !locked && setQuestionCount(count)}
                        className={`px-5 py-3 rounded-xl border-2 text-center transition-all relative ${
                          locked
                            ? 'border-border opacity-50 cursor-not-allowed'
                            : questionCount === count
                              ? 'border-primary bg-accent shadow-md'
                              : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {locked && <Lock className="w-3 h-3 text-muted-foreground absolute top-1 right-1" />}
                        <span className="text-lg font-bold text-foreground">{count}</span>
                      </button>
                    </TooltipTrigger>
                    {locked && <TooltipContent>Disponible con suscripción</TooltipContent>}
                  </Tooltip>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="customCount" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Personalizado:
              </Label>
              <Input
                id="customCount"
                type="number"
                min={1}
                max={isFreeUser ? 10 : ENARM_QUESTION_COUNT}
                value={questionCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  const max = isFreeUser ? 10 : ENARM_QUESTION_COUNT;
                  setQuestionCount(Math.min(Math.max(1, val), max));
                }}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">de {isFreeUser ? 10 : ENARM_QUESTION_COUNT} máx.</span>
            </div>
          </div>
        ),
      },
      {
        title: 'Resumen',
        subtitle: 'Revisa tu configuración antes de comenzar',
        content: (
          <Card className="border-0 shadow-lg gradient-card">
            <CardContent className="p-6 space-y-4">
              {[
                { label: 'Idioma', value: language === 'es' ? '🇲🇽 Español' : '🇺🇸 English' },
                { label: 'Modo', value: mode === 'study' ? '📚 Estudio' : '🎯 Simulación' },
                { label: 'Simulador', value: adaptiveMode ? 'Adaptativo activado' : 'Estándar' },
                {
                  label: 'Especialidades',
                  value: categories.filter((c) => selectedCategories.includes(c.id)).map((c) => c.name).join(', ') || '—',
                },
                {
                  label: 'Filtro',
                  value: questionFilter === 'all' ? '📋 Todas' : questionFilter === 'unanswered' ? '❓ Sin resolver' : '✅ Ya resueltas',
                },
                { label: 'Preguntas', value: `${questionCount} preguntas` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ),
      },
    ],
    [
      loadingTree,
      categories,
      language,
      mode,
      selectedCategories,
      questionFilter,
      adaptiveMode,
      questionCount,
      isFreeUser,
      freeTrialExamsRemaining,
      navigate,
      filteredSubcategories,
      selectedSubcategories,
    ]
  );

  const isLast = step === steps.length - 1;
  const canProceed = step === 2 ? selectedCategories.length > 0 : true;

  const startExam = async () => {
    setStarting(true);
    try {
      const json = await apiJson<{ data: { id: string } }>('/api/exams/generate', {
        method: 'POST',
        body: JSON.stringify({
          language,
          mode,
          specialtyIds: selectedCategories,
          areaIds: selectedSubcategories.length > 0 ? selectedSubcategories : [],
          questionCount,
          questionFilter,
          adaptiveMode,
          predictionSpecialtyId: selectedCategories[0],
        }),
      });
      await refreshUser();
      navigate(`/exam/${json.data.id}/${mode}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el examen');
    } finally {
      setStarting(false);
    }
  };

  if (isFreeTrialExhausted) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Volver al dashboard
        </Button>
        <Alert className="border-warning/40 bg-warning/5">
          <Crown className="h-4 w-4 text-warning" />
          <AlertTitle>Prueba gratuita agotada</AlertTitle>
          <AlertDescription className="text-foreground space-y-0">
            <p>
              El plan gratuito incluye solo <strong>2 exámenes de prueba</strong> de hasta <strong>10 preguntas</strong> cada
              uno. Ya usaste ambos; para seguir creando exámenes necesitas una suscripción activa.
            </p>
          </AlertDescription>
        </Alert>
        <Button className="w-full gradient-primary border-0 font-semibold gap-2" onClick={() => navigate('/dashboard/subscription')}>
          <Crown className="w-4 h-4" /> Ver planes y suscribirme
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'gradient-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground">{steps[step].title}</h1>
        <p className="text-muted-foreground">{steps[step].subtitle}</p>
      </div>

      <div className="my-6">{steps[step].content}</div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => (step === 0 ? navigate('/dashboard') : setStep(step - 1))} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancelar' : 'Anterior'}
        </Button>
        <Button
          disabled={!canProceed || starting}
          onClick={() => (isLast ? startExam() : setStep(step + 1))}
          className={`gap-2 ${isLast ? 'gradient-primary border-0 font-semibold px-8' : ''}`}
        >
          {isLast ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> {starting ? 'Generando…' : 'Comenzar Examen'}
            </>
          ) : (
            <>
              Siguiente <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default NewExam;
