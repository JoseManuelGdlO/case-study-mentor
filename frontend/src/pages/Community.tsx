import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import { ClinicalRichTextEditor } from '@/components/ClinicalRichTextEditor';
import { RichOrPlainBlock } from '@/components/RichOrPlainBlock';
import { htmlToPlainText, isRichTextEmpty } from '@/lib/richText';

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
  const PAGE_SIZE = 10;
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [createSpecialtyId, setCreateSpecialtyId] = useState<string>('all');
  const [filterSpecialtyId, setFilterSpecialtyId] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThread, setSelectedThread] = useState<ThreadDetail | null>(null);
  const [isThreadModalOpen, setIsThreadModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('<p></p>');
  const [reply, setReply] = useState('<p></p>');
  const [loading, setLoading] = useState(true);
  const [savingThread, setSavingThread] = useState(false);
  const [savingReply, setSavingReply] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadThreads = async (params: { specialtyId?: string; page?: number; search?: string } = {}) => {
    const targetPage = params.page ?? 1;
    setLoadingThreads(true);
    const qs = new URLSearchParams({ page: String(targetPage), limit: String(PAGE_SIZE) });
    if (params.specialtyId) qs.set('specialtyId', params.specialtyId);
    if (params.search) qs.set('search', params.search);
    try {
      const json = await apiJson<{ data: ThreadRow[]; total: number; page: number; limit: number }>(
        `/api/community/threads?${qs.toString()}`
      );
      setThreads(json.data);
      setTotal(json.total);
      setPage(json.page);
      if (selectedThread) {
        const stillExists = json.data.find((t) => t.id === selectedThread.id);
        if (!stillExists && !isThreadModalOpen) setSelectedThread(null);
      }
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadThreadDetail = async (threadId: string) => {
    const json = await apiJson<{ data: ThreadDetail }>(`/api/community/threads/${threadId}`);
    setSelectedThread(json.data);
    setIsThreadModalOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [specialtiesJson, threadsJson] = await Promise.all([
          apiJson<{ data: Specialty[] }>('/api/specialties'),
          apiJson<{ data: ThreadRow[]; total: number; page: number }>('/api/community/threads?page=1&limit=10'),
        ]);
        if (cancelled) return;
        setSpecialties(specialtiesJson.data);
        setThreads(threadsJson.data);
        setTotal(threadsJson.total);
        setPage(threadsJson.page);
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
    if (title.trim().length < 5 || isRichTextEmpty(body) || htmlToPlainText(body).length < 10) {
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
          specialtyId: createSpecialtyId === 'all' ? null : createSpecialtyId,
        }),
      });
      setTitle('');
      setBody('<p></p>');
      await loadThreads({
        specialtyId: filterSpecialtyId === 'all' ? undefined : filterSpecialtyId,
        search: searchQuery || undefined,
        page: 1,
      });
      toast.success('Hilo publicado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo publicar el hilo');
    } finally {
      setSavingThread(false);
    }
  };

  const onReply = async () => {
    if (!selectedThread) return;
    if (isRichTextEmpty(reply) || htmlToPlainText(reply).length < 2) {
      toast.error('Tu respuesta es muy corta');
      return;
    }
    setSavingReply(true);
    try {
      await apiJson(`/api/community/threads/${selectedThread.id}/posts`, {
        method: 'POST',
        body: JSON.stringify({ body: reply }),
      });
      setReply('<p></p>');
      await loadThreadDetail(selectedThread.id);
      await loadThreads({
        specialtyId: filterSpecialtyId === 'all' ? undefined : filterSpecialtyId,
        search: searchQuery || undefined,
        page,
      });
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
                value={createSpecialtyId}
                onValueChange={(value) => setCreateSpecialtyId(value)}
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
              <ClinicalRichTextEditor
                value={body}
                onChange={setBody}
                placeholder="Describe tu duda con contexto clínico..."
                minHeightClass="min-h-[160px]"
              />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                className="md:col-span-2"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar pregunta o tema en la comunidad"
              />
              <Select value={filterSpecialtyId} onValueChange={setFilterSpecialtyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar especialidad" />
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(searchInput.trim());
                  void loadThreads({
                    specialtyId: filterSpecialtyId === 'all' ? undefined : filterSpecialtyId,
                    search: searchInput.trim() || undefined,
                    page: 1,
                  });
                }}
              >
                Buscar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setFilterSpecialtyId('all');
                  void loadThreads({ page: 1 });
                }}
              >
                Limpiar filtros
              </Button>
            </div>
            {loadingThreads ? (
              <p className="text-sm text-muted-foreground">Cargando hilos…</p>
            ) : !threads.length ? (
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
                  <p className="text-sm text-muted-foreground line-clamp-2">{htmlToPlainText(thread.body)}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {thread.author.name} · {new Date(thread.createdAt).toLocaleString('es-MX')} · {thread.postCount} respuestas
                    {thread.specialty ? ` · ${thread.specialty.name}` : ''}
                  </p>
                </button>
              ))
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Página {page} de {totalPages} · {total} hilos
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loadingThreads}
                    onClick={() =>
                      void loadThreads({
                        specialtyId: filterSpecialtyId === 'all' ? undefined : filterSpecialtyId,
                        search: searchQuery || undefined,
                        page: page - 1,
                      })
                    }
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loadingThreads}
                    onClick={() =>
                      void loadThreads({
                        specialtyId: filterSpecialtyId === 'all' ? undefined : filterSpecialtyId,
                        search: searchQuery || undefined,
                        page: page + 1,
                      })
                    }
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={isThreadModalOpen} onOpenChange={setIsThreadModalOpen}>
        <DialogContent className="max-w-3xl">
          {selectedThread ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedThread.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="border rounded-md p-3 bg-muted/30">
                  <RichOrPlainBlock text={selectedThread.body} format="html" className="text-sm" />
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
                        <RichOrPlainBlock text={post.body} format="html" className="text-sm" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {post.author.name} · {new Date(post.createdAt).toLocaleString('es-MX')}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Agregar respuesta</Label>
                  <ClinicalRichTextEditor
                    value={reply}
                    onChange={setReply}
                    placeholder="Responde con tu razonamiento..."
                    minHeightClass="min-h-[130px]"
                  />
                  <Button onClick={() => void onReply()} disabled={savingReply}>
                    {savingReply ? 'Enviando…' : 'Responder'}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
