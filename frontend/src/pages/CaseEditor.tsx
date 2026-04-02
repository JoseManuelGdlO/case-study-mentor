import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type { CaseStatus, Category, ClinicalCase } from '@/types';
import { ArrowLeft, Plus, Trash2, ImagePlus, Save, FlaskConical } from 'lucide-react';
import { apiFetch, apiJson, getUploadUrl } from '@/lib/api';
import { toast } from 'sonner';

interface LabForm {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
}

type DifficultyLevelForm = 1 | 2 | 3;

interface QuestionForm {
  text: string;
  imageUrl: string;
  feedbackImageUrl: string;
  options: { label: string; text: string; imageUrl: string; isCorrect: boolean; explanation: string }[];
  summary: string;
  bibliography: string;
  difficultyLevel: DifficultyLevelForm;
  cognitiveCompetence: boolean;
  previousEnarmPresence: boolean;
  hint: string;
}

const emptyLab = (): LabForm => ({ name: '', value: '', unit: '', normalRange: '' });

const emptyQuestion = (): QuestionForm => ({
  text: '',
  imageUrl: '',
  feedbackImageUrl: '',
  options: [
    { label: 'A', text: '', imageUrl: '', isCorrect: false, explanation: '' },
    { label: 'B', text: '', imageUrl: '', isCorrect: false, explanation: '' },
    { label: 'C', text: '', imageUrl: '', isCorrect: false, explanation: '' },
    { label: 'D', text: '', imageUrl: '', isCorrect: false, explanation: '' },
  ],
  summary: '',
  bibliography: '',
  difficultyLevel: 2,
  cognitiveCompetence: false,
  previousEnarmPresence: false,
  hint: '',
});

function mapCaseToForm(c: ClinicalCase): {
  specialtyId: string;
  areaId: string;
  topic: string;
  language: string;
  caseText: string;
  caseImageUrl: string;
  status: CaseStatus;
  generatedByIa: boolean;
  labs: LabForm[];
  questions: QuestionForm[];
} {
  const sid = c.specialtyId ?? '';
  const aid = c.areaId ?? '';
  return {
    specialtyId: sid,
    areaId: aid,
    topic: c.topic,
    language: c.language,
    caseText: c.text,
    caseImageUrl: c.imageUrl ?? '',
    status: c.status,
    generatedByIa: c.generatedByIa ?? false,
    labs: (c.labResults ?? []).map((l) => ({
      name: l.name,
      value: l.value,
      unit: l.unit,
      normalRange: l.normalRange,
    })),
    questions:
      c.questions.length > 0
        ? c.questions.map((q) => ({
            text: q.text,
            imageUrl: q.imageUrl ?? '',
            feedbackImageUrl: q.feedbackImageUrl ?? '',
            options: q.options.map((o) => ({
              label: o.label,
              text: o.text,
              imageUrl: o.imageUrl ?? '',
              isCorrect: Boolean(o.isCorrect),
              explanation: o.explanation ?? '',
            })),
            summary: q.summary,
            bibliography: q.bibliography,
            difficultyLevel:
              q.difficultyLevel === 1 || q.difficultyLevel === 2 || q.difficultyLevel === 3
                ? q.difficultyLevel
                : 2,
            cognitiveCompetence: Boolean(q.cognitiveCompetence),
            previousEnarmPresence: Boolean(q.previousEnarmPresence),
            hint: q.hint ?? '',
          }))
        : [emptyQuestion()],
  };
}

async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await apiFetch('/api/upload/image', { method: 'POST', body: fd });
  const json = (await res.json()) as { data?: { url: string }; error?: string };
  if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Error al subir imagen');
  if (!json.data?.url) throw new Error('Respuesta inválida del servidor');
  return json.data.url;
}

const CaseEditor = () => {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const isEdit = Boolean(caseId);
  const caseFileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [caseLoading, setCaseLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [specialtyId, setSpecialtyId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('es');
  const [caseText, setCaseText] = useState('');
  const [caseImageUrl, setCaseImageUrl] = useState('');
  const [status, setStatus] = useState<CaseStatus>('draft');
  const [generatedByIa, setGeneratedByIa] = useState(false);
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);
  const [labs, setLabs] = useState<LabForm[]>([]);

  const selectedCategory = categories.find((c) => c.id === specialtyId);

  useEffect(() => {
    let cancelled = false;
    apiJson<{ data: Category[] }>('/api/specialties')
      .then((r) => {
        if (!cancelled) setCategories(r.data);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          toast.error('No se pudo cargar el catálogo de especialidades');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!caseId) {
      setCaseLoading(false);
      return;
    }
    let cancelled = false;
    setCaseLoading(true);
    apiJson<{ data: ClinicalCase }>(`/api/cases/${caseId}`)
      .then((r) => {
        if (cancelled) return;
        const m = mapCaseToForm(r.data);
        if (!m.specialtyId || !m.areaId) {
          toast.error('El caso no incluye IDs de especialidad/área; edita y vuelve a guardar.');
        }
        setSpecialtyId(m.specialtyId);
        setAreaId(m.areaId);
        setTopic(m.topic);
        setLanguage(m.language);
        setCaseText(m.caseText);
        setCaseImageUrl(m.caseImageUrl);
        setStatus(m.status);
        setGeneratedByIa(m.generatedByIa);
        setLabs(m.labs);
        setQuestions(m.questions);
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Error al cargar el caso');
      })
      .finally(() => {
        if (!cancelled) setCaseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));

  const updateQuestion = (index: number, field: string, value: unknown) => {
    const updated = [...questions];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, field: string, value: unknown) => {
    const updated = [...questions];
    if (field === 'isCorrect' && value) {
      updated[qIndex].options.forEach((o, i) => (o.isCorrect = i === oIndex));
    } else {
      (updated[qIndex].options[oIndex] as unknown as Record<string, unknown>)[field] = value;
    }
    setQuestions(updated);
  };

  const onCaseImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      setCaseImageUrl(url);
      toast.success('Imagen del caso subida');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    }
  };

  const onQuestionImagePick = async (qi: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      updateQuestion(qi, 'imageUrl', url);
      toast.success('Imagen de la pregunta subida');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    }
  };

  const onFeedbackImagePick = async (qi: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      updateQuestion(qi, 'feedbackImageUrl', url);
      toast.success('Imagen de feedback subida');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    }
  };

  const onOptionImagePick = async (qi: number, oi: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      updateOption(qi, oi, 'imageUrl', url);
      toast.success('Imagen de la opción subida');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    }
  };

  const buildPayload = useCallback(() => {
    return {
      specialtyId,
      areaId,
      topic: topic.trim(),
      language: language as 'es' | 'en',
      text: caseText.trim(),
      imageUrl: caseImageUrl.trim() || null,
      status,
      generatedByIa,
      labResults: labs.map((l) => ({
        name: l.name.trim(),
        value: l.value.trim(),
        unit: l.unit.trim(),
        normalRange: l.normalRange.trim(),
      })),
      questions: questions.map((q, qi) => ({
        text: q.text.trim(),
        imageUrl: q.imageUrl.trim() || null,
        feedbackImageUrl: q.feedbackImageUrl.trim() || null,
        summary: q.summary.trim(),
        bibliography: q.bibliography.trim(),
        difficultyLevel: q.difficultyLevel,
        cognitiveCompetence: q.cognitiveCompetence,
        previousEnarmPresence: q.previousEnarmPresence,
        hint: q.hint.trim(),
        orderIndex: qi,
        options: q.options.map((o) => ({
          label: o.label,
          text: o.text.trim(),
          imageUrl: o.imageUrl.trim() || null,
          isCorrect: o.isCorrect,
          explanation: o.explanation.trim(),
        })),
      })),
    };
  }, [specialtyId, areaId, topic, language, caseText, caseImageUrl, status, generatedByIa, labs, questions]);

  const validate = (): boolean => {
    if (!specialtyId || !areaId) {
      toast.error('Selecciona especialidad y área');
      return false;
    }
    if (!topic.trim() || !caseText.trim()) {
      toast.error('Tema y texto del caso son obligatorios');
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`La pregunta ${i + 1} necesita texto`);
        return false;
      }
      if (!q.summary.trim() || !q.bibliography.trim()) {
        toast.error(`La pregunta ${i + 1} necesita resumen y bibliografía`);
        return false;
      }
      const correct = q.options.filter((o) => o.isCorrect);
      if (correct.length !== 1) {
        toast.error(`La pregunta ${i + 1} debe tener exactamente una opción correcta`);
        return false;
      }
      for (const o of q.options) {
        if (!o.text.trim() || !o.explanation.trim()) {
          toast.error(`Completa texto y explicación de todas las opciones (pregunta ${i + 1})`);
          return false;
        }
      }
    }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    const body = buildPayload();
    setSaving(true);
    try {
      if (isEdit && caseId) {
        await apiJson(`/api/cases/${caseId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        toast.success('Caso actualizado');
      } else {
        await apiJson('/api/cases', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Caso creado');
      }
      navigate('/backoffice/cases');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (caseLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-muted-foreground animate-fade-in">Cargando caso…</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <input ref={caseFileRef} type="file" accept="image/*" className="hidden" onChange={onCaseImagePick} />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/backoffice/cases')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{isEdit ? 'Editar Caso Clínico' : 'Nuevo Caso Clínico'}</h1>
          <p className="text-muted-foreground">
            {loadError ? 'Sin catálogo de especialidades; revisa la sesión y el API.' : 'Completa los campos y guarda en el servidor'}
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Clasificación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Especialidad</Label>
            <Select
              value={specialtyId}
              onValueChange={(v) => {
                setSpecialtyId(v);
                setAreaId('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Área / Subespecialidad</Label>
            <Select value={areaId} onValueChange={setAreaId} disabled={!selectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory?.subcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tema</Label>
            <Input placeholder="Ej: Infarto Agudo al Miocardio" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">🇲🇽 Español</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CaseStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="archived">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2 sm:col-span-2">
            <Checkbox
              id="generated-by-ia"
              checked={generatedByIa}
              onCheckedChange={(v) => setGeneratedByIa(v === true)}
            />
            <Label htmlFor="generated-by-ia" className="text-sm font-normal cursor-pointer">
              Generado por IA
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Caso Clínico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Escribe el caso clínico aquí..."
            className="min-h-[150px]"
            value={caseText}
            onChange={(e) => setCaseText(e.target.value)}
          />
          {caseImageUrl ? (
            <div className="space-y-2">
              <img
                src={getUploadUrl(caseImageUrl)}
                alt="Caso"
                className="max-h-48 rounded-lg border object-contain"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setCaseImageUrl('')}>
                Quitar imagen
              </Button>
            </div>
          ) : null}
          <Button type="button" variant="outline" className="gap-2" onClick={() => caseFileRef.current?.click()}>
            <ImagePlus className="w-4 h-4" /> Subir imagen del caso
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> Laboratorios
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setLabs([...labs, emptyLab()])}>
            <Plus className="w-4 h-4" /> Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {labs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se han agregado laboratorios. Agrega resultados de laboratorio para este caso clínico.
            </p>
          )}
          {labs.map((lab, li) => (
            <div key={li} className="grid grid-cols-[1fr_0.6fr_0.5fr_1fr_auto] gap-2 items-end">
              <div className="space-y-1">
                {li === 0 && <Label className="text-xs">Estudio</Label>}
                <Input
                  placeholder="Ej: Hemoglobina"
                  value={lab.name}
                  onChange={(e) => {
                    const u = [...labs];
                    u[li].name = e.target.value;
                    setLabs(u);
                  }}
                />
              </div>
              <div className="space-y-1">
                {li === 0 && <Label className="text-xs">Valor</Label>}
                <Input
                  placeholder="12.5"
                  value={lab.value}
                  onChange={(e) => {
                    const u = [...labs];
                    u[li].value = e.target.value;
                    setLabs(u);
                  }}
                />
              </div>
              <div className="space-y-1">
                {li === 0 && <Label className="text-xs">Unidad</Label>}
                <Input
                  placeholder="g/dL"
                  value={lab.unit}
                  onChange={(e) => {
                    const u = [...labs];
                    u[li].unit = e.target.value;
                    setLabs(u);
                  }}
                />
              </div>
              <div className="space-y-1">
                {li === 0 && <Label className="text-xs">Rango normal</Label>}
                <Input
                  placeholder="12 - 16"
                  value={lab.normalRange}
                  onChange={(e) => {
                    const u = [...labs];
                    u[li].normalRange = e.target.value;
                    setLabs(u);
                  }}
                />
              </div>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setLabs(labs.filter((_, i) => i !== li))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {questions.map((q, qi) => (
        <Card key={qi} className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Pregunta {qi + 1}
              <Badge variant="outline" className="ml-2">
                <Select
                  value={String(q.difficultyLevel)}
                  onValueChange={(v) => updateQuestion(qi, 'difficultyLevel', Number(v) as DifficultyLevelForm)}
                >
                  <SelectTrigger className="border-0 h-auto p-0 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Dificultad: Baja</SelectItem>
                    <SelectItem value="2">Dificultad: Media</SelectItem>
                    <SelectItem value="3">Dificultad: Alta</SelectItem>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`cc-${qi}`}
                  checked={q.cognitiveCompetence}
                  onCheckedChange={(v) => updateQuestion(qi, 'cognitiveCompetence', Boolean(v))}
                />
                <Label htmlFor={`cc-${qi}`} className="text-sm font-normal cursor-pointer">
                  Competencia cognitiva (Sí)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`enarm-${qi}`}
                  checked={q.previousEnarmPresence}
                  onCheckedChange={(v) => updateQuestion(qi, 'previousEnarmPresence', Boolean(v))}
                />
                <Label htmlFor={`enarm-${qi}`} className="text-sm font-normal cursor-pointer">
                  Presencia en ENARM previo
                </Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pista (opcional)</Label>
              <Textarea
                placeholder="Texto de ayuda para el estudiante, sin revelar la respuesta correcta"
                className="min-h-[72px]"
                value={q.hint}
                onChange={(e) => updateQuestion(qi, 'hint', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto de la pregunta</Label>
              <Textarea
                placeholder="¿Cuál es el diagnóstico más probable?"
                value={q.text}
                onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Imagen de la pregunta (opcional)</Label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id={`question-img-${qi}`}
                onChange={(e) => void onQuestionImagePick(qi, e)}
              />
              {q.imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={getUploadUrl(q.imageUrl)}
                    alt={`Pregunta ${qi + 1}`}
                    className="max-h-40 rounded-lg border object-contain"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => updateQuestion(qi, 'imageUrl', '')}>
                    Quitar imagen
                  </Button>
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById(`question-img-${qi}`)?.click()}
              >
                <ImagePlus className="w-4 h-4" /> Subir imagen de la pregunta
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Imagen de feedback (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Se muestra en Modo Estudio después de contestar, en lugar de la imagen de la pregunta (si la defines).
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id={`question-feedback-img-${qi}`}
                onChange={(e) => void onFeedbackImagePick(qi, e)}
              />
              {q.feedbackImageUrl ? (
                <div className="space-y-2">
                  <img
                    src={getUploadUrl(q.feedbackImageUrl)}
                    alt={`Feedback pregunta ${qi + 1}`}
                    className="max-h-40 rounded-lg border object-contain"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => updateQuestion(qi, 'feedbackImageUrl', '')}>
                    Quitar imagen
                  </Button>
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById(`question-feedback-img-${qi}`)?.click()}
              >
                <ImagePlus className="w-4 h-4" /> Subir imagen de feedback
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Opciones de respuesta</Label>
              {q.options.map((opt, oi) => (
                <div
                  key={oi}
                  className={`p-4 rounded-xl border-2 space-y-3 ${opt.isCorrect ? 'border-success bg-success/5' : 'border-border'}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${opt.isCorrect ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {opt.label}
                    </span>
                    <Input
                      placeholder={`Texto de opción ${opt.label}`}
                      className="flex-1"
                      value={opt.text}
                      onChange={(e) => updateOption(qi, oi, 'text', e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Checkbox checked={opt.isCorrect} onCheckedChange={(v) => updateOption(qi, oi, 'isCorrect', v)} />
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Correcta</Label>
                    </div>
                  </div>
                  <div className="space-y-2 pl-11">
                    <Label className="text-xs text-muted-foreground">Imagen de la opción (opcional)</Label>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`option-img-${qi}-${oi}`}
                      onChange={(e) => void onOptionImagePick(qi, oi, e)}
                    />
                    {opt.imageUrl ? (
                      <div className="space-y-2">
                        <img
                          src={getUploadUrl(opt.imageUrl)}
                          alt={`Opción ${opt.label}`}
                          className="max-h-32 rounded-lg border object-contain"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateOption(qi, oi, 'imageUrl', '')}
                        >
                          Quitar imagen
                        </Button>
                      </div>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => document.getElementById(`option-img-${qi}-${oi}`)?.click()}
                    >
                      <ImagePlus className="w-4 h-4" /> Subir imagen
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Explicación de esta opción..."
                    className="text-sm min-h-[60px]"
                    value={opt.explanation}
                    onChange={(e) => updateOption(qi, oi, 'explanation', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>En Resumen</Label>
              <Textarea
                placeholder="Resumen de la explicación..."
                value={q.summary}
                onChange={(e) => updateQuestion(qi, 'summary', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bibliografía</Label>
              <Input
                placeholder="Fuente bibliográfica..."
                value={q.bibliography}
                onChange={(e) => updateQuestion(qi, 'bibliography', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full gap-2 h-12 border-dashed" onClick={addQuestion}>
        <Plus className="w-4 h-4" /> Agregar otra pregunta
      </Button>

      <div className="flex gap-4 justify-end pb-8">
        <Button variant="outline" onClick={() => navigate('/backoffice/cases')} disabled={saving}>
          Cancelar
        </Button>
        <Button className="gradient-primary border-0 font-semibold gap-2 px-8" onClick={save} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Guardando…' : 'Guardar caso'}
        </Button>
      </div>
    </div>
  );
};

export default CaseEditor;
