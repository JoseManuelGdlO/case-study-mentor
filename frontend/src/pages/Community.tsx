import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

type Specialty = { id: string; name: string };
type ThreadRow = {
  id: string;
  title: string;
  body: string;
  postCount: number;
  createdAt: string;
  author: { id: string; name: string };
  specialty: { id: string; name: string } | null;
};
type PostRow = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
};
type ThreadDetail = ThreadRow & { posts: PostRow[] };

const Community = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('all');
  const [selectedThread, setSelectedThread] = useState<ThreadDetail | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingThread, setSavingThread] = useState(false);
  const [savingReply, setSavingReply] = useState(false);

  const loadThreads = async (specialtyId?: string) => {
    const qs = new URLSearchParams({ page: '1', limit: '50' });
    if (specialtyId) qs.set('specialtyId', specialtyId);
    const json = await apiJson<{ data: ThreadRow[] }>(`/api/community/threads?${qs.toString()}`);
    setThreads(json.data);
    if (selectedThread) {
      const stillExists = json.data.find((t) => t.id === selectedThread.id);
      if (!stillExists) setSelectedThread(null);
    }
  };

  const loadThreadDetail = async (threadId: string) => {
    const json = await apiJson<{ data: ThreadDetail }>(`/api/community/threads/${threadId}`);
    setSelectedThread(json.data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [specialtiesJson, threadsJson] = await Promise.all([
          apiJson<{ data: Specialty[] }>('/api/specialties'),
          apiJson<{ data: ThreadRow[] }>('/api/community/threads?page=1&limit=50'),
        ]);
        if (cancelled) return;
        setSpecialties(specialtiesJson.data);
        setThreads(threadsJson.data);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'No se pudo cargar la comunidad');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCreateThread = async () => {
    if (title.trim().length < 5 || body.trim().length < 10) {
      toast.error('Completa un título y descripción más detallados');
      return;
    }
    setSavingThread(true);
    try {
      await apiJson('/api/community/threads', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          specialtyId: selectedSpecialtyId === 'all' ? null : selectedSpecialtyId,
        }),
      });
      setTitle('');
      setBody('');
      await loadThreads(selectedSpecialtyId === 'all' ? undefined : selectedSpecialtyId);
      toast.success('Hilo publicado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo publicar el hilo');
    } finally {
      setSavingThread(false);
    }
  };

  const onReply = async () => {
    if (!selectedThread) return;
    if (reply.trim().length < 2) {
      toast.error('Tu respuesta es muy corta');
      return;
    }
    setSavingReply(true);
    try {
      await apiJson(`/api/community/threads/${selectedThread.id}/posts`, {
        method: 'POST',
        body: JSON.stringify({ body: reply.trim() }),
      });
      setReply('');
      await loadThreadDetail(selectedThread.id);
      await loadThreads(selectedSpecialtyId === 'all' ? undefined : selectedSpecialtyId);
      toast.success('Respuesta enviada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar la respuesta');
    } finally {
      setSavingReply(false);
    }
  };

  if (loading) return <div className="max-w-6xl mx-auto p-6 text-muted-foreground">Cargando…</div>;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="space-y-4 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Nuevo hilo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Especialidad (opcional)</Label>
              <Select
                value={selectedSpecialtyId}
                onValueChange={(value) => {
                  setSelectedSpecialtyId(value);
                  void loadThreads(value === 'all' ? undefined : value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Duda sobre choque séptico" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
            </div>
            <Button className="w-full" onClick={() => void onCreateThread()} disabled={savingThread}>
              {savingThread ? 'Publicando…' : 'Publicar hilo'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Comunidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!threads.length ? (
              <p className="text-sm text-muted-foreground">No hay hilos todavía para este filtro.</p>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className="w-full text-left border rounded-md p-3 hover:bg-muted/50 transition-colors"
                  onClick={() => void loadThreadDetail(thread.id)}
                >
                  <h3 className="font-semibold text-foreground">{thread.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{thread.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {thread.author.name} · {new Date(thread.createdAt).toLocaleString('es-MX')} · {thread.postCount} respuestas
                    {thread.specialty ? ` · ${thread.specialty.name}` : ''}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {selectedThread && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedThread.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-3 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">{selectedThread.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedThread.author.name} · {new Date(selectedThread.createdAt).toLocaleString('es-MX')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Respuestas</h4>
                {!selectedThread.posts.length ? (
                  <p className="text-sm text-muted-foreground">Aún no hay respuestas.</p>
                ) : (
                  selectedThread.posts.map((post) => (
                    <div key={post.id} className="border rounded-md p-3">
                      <p className="text-sm whitespace-pre-wrap">{post.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {post.author.name} · {new Date(post.createdAt).toLocaleString('es-MX')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <Label>Agregar respuesta</Label>
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
                <Button onClick={() => void onReply()} disabled={savingReply}>
                  {savingReply ? 'Enviando…' : 'Responder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Community;
