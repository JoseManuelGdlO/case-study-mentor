import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { categories } from '@/data/mockData';
import { ArrowLeft, Plus, Trash2, ImagePlus, Save, CheckCircle2 } from 'lucide-react';

interface QuestionForm {
  text: string;
  imageUrl: string;
  options: { label: string; text: string; isCorrect: boolean; explanation: string }[];
  summary: string;
  bibliography: string;
  difficulty: string;
}

const emptyQuestion = (): QuestionForm => ({
  text: '',
  imageUrl: '',
  options: [
    { label: 'A', text: '', isCorrect: false, explanation: '' },
    { label: 'B', text: '', isCorrect: false, explanation: '' },
    { label: 'C', text: '', isCorrect: false, explanation: '' },
    { label: 'D', text: '', isCorrect: false, explanation: '' },
  ],
  summary: '',
  bibliography: '',
  difficulty: 'medium',
});

const CaseEditor = () => {
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState('');
  const [area, setArea] = useState('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('es');
  const [caseText, setCaseText] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);

  const selectedCategory = categories.find((c) => c.name === specialty);

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
    const updated = [...questions];
    if (field === 'isCorrect' && value) {
      updated[qIndex].options.forEach((o, i) => (o.isCorrect = i === oIndex));
    } else {
      (updated[qIndex].options[oIndex] as any)[field] = value;
    }
    setQuestions(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/backoffice')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Caso Clínico</h1>
          <p className="text-muted-foreground">Completa todos los campos para crear un caso</p>
        </div>
      </div>

      {/* Classification */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Clasificación</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Especialidad</Label>
            <Select value={specialty} onValueChange={(v) => { setSpecialty(v); setArea(''); }}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Área / Subespecialidad</Label>
            <Select value={area} onValueChange={setArea} disabled={!selectedCategory}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{selectedCategory?.subcategories.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tema</Label>
            <Input placeholder="Ej: Infarto Agudo al Miocardio" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="es">🇲🇽 Español</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Case Text */}
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle>Caso Clínico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Escribe el caso clínico aquí..." className="min-h-[150px]" value={caseText} onChange={(e) => setCaseText(e.target.value)} />
          <Button variant="outline" className="gap-2"><ImagePlus className="w-4 h-4" /> Agregar imagen</Button>
        </CardContent>
      </Card>

      {/* Questions */}
      {questions.map((q, qi) => (
        <Card key={qi} className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Pregunta {qi + 1}
              <Badge variant="outline" className="ml-2">
                <Select value={q.difficulty} onValueChange={(v) => updateQuestion(qi, 'difficulty', v)}>
                  <SelectTrigger className="border-0 h-auto p-0 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </Badge>
            </CardTitle>
            {questions.length > 1 && (
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeQuestion(qi)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Texto de la pregunta</Label>
              <Textarea placeholder="¿Cuál es el diagnóstico más probable?" value={q.text} onChange={(e) => updateQuestion(qi, 'text', e.target.value)} />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Opciones de respuesta</Label>
              {q.options.map((opt, oi) => (
                <div key={oi} className={`p-4 rounded-xl border-2 space-y-3 ${opt.isCorrect ? 'border-success bg-success/5' : 'border-border'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${opt.isCorrect ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {opt.label}
                    </span>
                    <Input placeholder={`Texto de opción ${opt.label}`} className="flex-1" value={opt.text} onChange={(e) => updateOption(qi, oi, 'text', e.target.value)} />
                    <div className="flex items-center gap-2">
                      <Checkbox checked={opt.isCorrect} onCheckedChange={(v) => updateOption(qi, oi, 'isCorrect', v)} />
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Correcta</Label>
                    </div>
                  </div>
                  <Textarea placeholder="Explicación de esta opción..." className="text-sm min-h-[60px]" value={opt.explanation} onChange={(e) => updateOption(qi, oi, 'explanation', e.target.value)} />
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>En Resumen</Label>
              <Textarea placeholder="Resumen de la explicación..." value={q.summary} onChange={(e) => updateQuestion(qi, 'summary', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bibliografía</Label>
              <Input placeholder="Fuente bibliográfica..." value={q.bibliography} onChange={(e) => updateQuestion(qi, 'bibliography', e.target.value)} />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full gap-2 h-12 border-dashed" onClick={addQuestion}>
        <Plus className="w-4 h-4" /> Agregar otra pregunta
      </Button>

      {/* Actions */}
      <div className="flex gap-4 justify-end pb-8">
        <Button variant="outline" onClick={() => navigate('/backoffice')}>Cancelar</Button>
        <Button className="gradient-primary border-0 font-semibold gap-2 px-8">
          <Save className="w-4 h-4" /> Guardar caso
        </Button>
      </div>
    </div>
  );
};

export default CaseEditor;
