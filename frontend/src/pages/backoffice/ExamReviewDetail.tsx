import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Star, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import type { Exam } from '@/types';
import { RichOrPlainBlock } from '@/components/RichOrPlainBlock';

const ExamReviewDetail = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [student, setStudent] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!examId) return;
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const json = await apiJson<{
          data: { exam: Exam; student: { email: string; firstName: string; lastName: string } };
        }>(`/api/backoffice/exam-reviews/${examId}`);
        if (!c) {
          setExam(json.data.exam);
          setStudent(json.data.student);
          if (json.data.exam.mentorReview) {
            setRating(json.data.exam.mentorReview.rating);
            setComment(json.data.exam.mentorReview.comment);
          }
        }
      } catch (e) {
        if (!c) toast.error(e instanceof Error ? e.message : 'Error al cargar');
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [examId]);

  const alreadyReviewed = Boolean(exam?.mentorReview);

  const submit = async () => {
    if (!examId || rating < 1 || rating > 5) {
      toast.error('Selecciona una calificacion de 1 a 5 estrellas');
      return;
    }
    setSubmitting(true);
    try {
      const json = await apiJson<{
        data: { exam: Exam; student: { email: string; firstName: string; lastName: string } };
      }>(`/api/backoffice/exam-reviews/${examId}`, {
        method: 'PATCH',
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      setExam(json.data.exam);
      setStudent(json.data.student);
      toast.success('Revision guardada');
      navigate('/backoffice/exam-reviews');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam || !student) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{loading ? 'Cargando…' : 'Examen no encontrado'}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/backoffice/exam-reviews">Volver</Link>
        </Button>
      </div>
    );
  }

  const score = exam.score != null ? Math.round(exam.score) : null;
  const flat = exam.flatQuestions ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/backoffice/exam-reviews">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary" />
            Revisar examen
          </h1>
          <p className="text-muted-foreground text-sm">
            {student.firstName} {student.lastName} · {student.email}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Modo:</span>{' '}
            <span className="capitalize font-medium">{exam.config.mode}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Calificacion automatica:</span>{' '}
            <span className="font-medium">{score != null ? `${score}%` : '—'}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Preguntas:</span>{' '}
            <span className="font-medium">{flat.length}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tu valoracion (resumen)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Estrellas (1–5)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={alreadyReviewed}
                  onClick={() => setRating(n)}
                  className="p-1 rounded-md hover:bg-muted disabled:opacity-60 disabled:pointer-events-none"
                  aria-label={`${n} estrellas`}
                >
                  <Star
                    className={`w-9 h-9 ${n <= rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/35'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="review-comment">Comentarios</Label>
            <Textarea
              id="review-comment"
              className="mt-2 min-h-[120px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={alreadyReviewed}
              placeholder="Retroalimentacion para el alumno…"
              maxLength={8000}
            />
          </div>
          {alreadyReviewed ? (
            <p className="text-sm text-muted-foreground">
              Este examen ya fue revisado el{' '}
              {exam.mentorReview
                ? new Date(exam.mentorReview.reviewedAt).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : ''}
              .
            </p>
          ) : (
            <Button className="gradient-primary border-0" disabled={submitting || rating < 1} onClick={() => void submit()}>
              {submitting ? 'Guardando…' : 'Enviar revision'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vista rapida de preguntas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[480px] overflow-y-auto">
          {flat.slice(0, 12).map((q) => {
            const ans = exam.answers.find((a) => a.questionId === q.id);
            const fmt = q.caseTextFormat ?? 'plain';
            return (
              <div key={q.id} className="border-b border-border pb-4 last:border-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {q.specialty} · {q.area}
                </p>
                <RichOrPlainBlock format={fmt} text={q.caseText} className="text-sm text-muted-foreground line-clamp-3" />
                <RichOrPlainBlock format={fmt} text={q.text} className="text-sm font-medium mt-2" />
                <p className="text-xs mt-2">
                  Respuesta:{' '}
                  <span className={ans?.isCorrect ? 'text-success font-medium' : 'text-destructive font-medium'}>
                    {ans?.isCorrect === true ? 'Correcta' : ans?.isCorrect === false ? 'Incorrecta' : 'Sin contestar'}
                  </span>
                </p>
              </div>
            );
          })}
          {flat.length > 12 && (
            <p className="text-sm text-muted-foreground">… y {flat.length - 12} preguntas mas (el alumno ve el detalle en su cuenta).</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamReviewDetail;
