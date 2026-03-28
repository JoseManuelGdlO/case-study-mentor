import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { categories } from '@/data/mockData';
import type { ExamMode, ExamLanguage } from '@/types';
import { ArrowLeft, ArrowRight, Globe, BookOpen, Timer, CheckCircle2 } from 'lucide-react';

const questionCounts = [10, 20, 50, 100];

const NewExam = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<ExamLanguage>('es');
  const [mode, setMode] = useState<ExamMode>('study');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    setSelectedSubcategories(prev => prev.filter(s => {
      const cat = categories.find(c => c.subcategories.some(sc => sc.id === s));
      return cat && !selectedCategories.includes(cat.id);
    }));
  };

  const toggleSubcategory = (id: string) => {
    setSelectedSubcategories(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const filteredSubcategories = categories.filter(c => selectedCategories.includes(c.id)).flatMap(c => c.subcategories);

  const steps = [
    {
      title: 'Idioma', subtitle: '¿En qué idioma quieres tu examen?',
      content: (
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: 'es' as ExamLanguage, label: 'Español', flag: '🇲🇽' },
            { value: 'en' as ExamLanguage, label: 'English', flag: '🇺🇸' },
          ].map(opt => (
            <button
              key={opt.value}
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
      title: 'Modo de examen', subtitle: 'Elige cómo quieres practicar',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('study')}
            className={`p-6 rounded-xl border-2 text-left transition-all ${mode === 'study' ? 'border-primary bg-accent shadow-md' : 'border-border hover:border-primary/50'}`}
          >
            <BookOpen className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-bold text-lg text-foreground mb-1">📚 Modo Estudio</h3>
            <p className="text-sm text-muted-foreground">Recibe feedback inmediato en cada pregunta con explicaciones detalladas y bibliografía.</p>
          </button>
          <button
            onClick={() => setMode('simulation')}
            className={`p-6 rounded-xl border-2 text-left transition-all ${mode === 'simulation' ? 'border-primary bg-accent shadow-md' : 'border-border hover:border-primary/50'}`}
          >
            <Timer className="w-8 h-8 text-secondary mb-3" />
            <h3 className="font-bold text-lg text-foreground mb-1">🎯 Modo Simulación</h3>
            <p className="text-sm text-muted-foreground">Simula el examen real: sin feedback hasta terminar, con temporizador incluido.</p>
          </button>
        </div>
      ),
    },
    {
      title: 'Especialidades', subtitle: 'Selecciona las áreas que deseas practicar',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
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
      title: 'Subcategorías', subtitle: 'Personaliza tu examen aún más',
      content: filteredSubcategories.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Selecciona al menos una especialidad en el paso anterior</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSubcategories.map(sub => (
            <button
              key={sub.id}
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
      title: 'Número de preguntas', subtitle: '¿Cuántas preguntas quieres contestar?',
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {questionCounts.map(count => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`p-6 rounded-xl border-2 text-center transition-all ${questionCount === count ? 'border-primary bg-accent shadow-md' : 'border-border hover:border-primary/50'}`}
            >
              <span className="text-3xl font-bold text-foreground block">{count}</span>
              <span className="text-sm text-muted-foreground">preguntas</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Resumen', subtitle: 'Revisa tu configuración antes de comenzar',
      content: (
        <Card className="border-0 shadow-lg gradient-card">
          <CardContent className="p-6 space-y-4">
            {[
              { label: 'Idioma', value: language === 'es' ? '🇲🇽 Español' : '🇺🇸 English' },
              { label: 'Modo', value: mode === 'study' ? '📚 Estudio' : '🎯 Simulación' },
              { label: 'Especialidades', value: categories.filter(c => selectedCategories.includes(c.id)).map(c => c.name).join(', ') || 'Todas' },
              { label: 'Preguntas', value: `${questionCount} preguntas` },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-muted-foreground font-medium">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const canProceed = step === 2 ? selectedCategories.length > 0 : true;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Progress */}
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
        <Button variant="ghost" onClick={() => step === 0 ? navigate('/dashboard') : setStep(step - 1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Cancelar' : 'Anterior'}
        </Button>
        <Button
          disabled={!canProceed}
          onClick={() => isLast ? navigate('/exam/new/study') : setStep(step + 1)}
          className={`gap-2 ${isLast ? 'gradient-primary border-0 font-semibold px-8' : ''}`}
        >
          {isLast ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Comenzar Examen
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
