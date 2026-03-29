import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { apiFetch } from '@/lib/api';

interface ParsedCase {
  row: number;
  specialty: string;
  area: string;
  topic: string;
  language: string;
  caseText: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanationA: string;
  explanationB: string;
  explanationC: string;
  explanationD: string;
  summary: string;
  bibliography: string;
  difficulty: string;
  labName?: string;
  labValue?: string;
  labUnit?: string;
  labRange?: string;
  errors: string[];
}

const TEMPLATE_HEADERS = [
  'Especialidad', 'Área', 'Tema', 'Idioma (es/en)', 'Caso Clínico',
  'Pregunta', 'Opción A', 'Opción B', 'Opción C', 'Opción D',
  'Respuesta Correcta (A/B/C/D)', 'Explicación A', 'Explicación B',
  'Explicación C', 'Explicación D', 'Resumen', 'Bibliografía',
  'Dificultad (low/medium/high)', 'Lab - Estudio', 'Lab - Valor',
  'Lab - Unidad', 'Lab - Rango Normal',
];

/** Fila de ejemplo: formato válido para la plantilla; bórrala y sustituye por tus datos reales. */
const SAMPLE_DATA = [
  [
    'ELIMINAR FILA — Especialidad ejemplo',
    'ELIMINAR FILA — Área ejemplo',
    'ELIMINAR FILA — Tema ejemplo',
    'es',
    'ELIMINAR FILA — Texto de caso clínico de ejemplo. Borra esta fila completa o reemplázala por un caso real.',
    'ELIMINAR FILA — Pregunta de ejemplo',
    'Opción A (ejemplo)', 'Opción B (ejemplo)', 'Opción C (ejemplo)', 'Opción D (ejemplo)',
    'A',
    'Explicación opción A (ejemplo)',
    'Explicación opción B (ejemplo)',
    'Explicación opción C (ejemplo)',
    'Explicación opción D (ejemplo)',
    'Resumen de ejemplo — sustituir o borrar fila',
    'Bibliografía de ejemplo — sustituir o borrar fila',
    'medium',
    '', '', '', '',
  ],
];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const wsData = [TEMPLATE_HEADERS, ...SAMPLE_DATA];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 18) }));

  XLSX.utils.book_append_sheet(wb, ws, 'Casos Clínicos');

  // Instructions sheet
  const instrData = [
    ['Instrucciones para Carga Masiva de Casos Clínicos'],
    [''],
    ['1. La primera fila de datos (debajo de los encabezados) es solo un ejemplo: elimínala o sustitúyela por tu contenido real.'],
    ['2. Cada fila representa una pregunta de un caso clínico.'],
    ['3. Si un caso tiene múltiples preguntas, repite los campos del caso (Especialidad, Área, Tema, Caso Clínico) en cada fila.'],
    ['4. El sistema agrupará automáticamente las preguntas del mismo caso por Tema + Caso Clínico.'],
    ['5. La Respuesta Correcta debe ser A, B, C o D.'],
    ['6. El Idioma debe ser "es" (español) o "en" (inglés).'],
    ['7. La Dificultad debe ser "low", "medium" o "high".'],
    ['8. Los campos de laboratorio son opcionales. Si un caso no tiene labs, deja esas columnas vacías.'],
    ['9. Para agregar múltiples labs al mismo caso, agrega filas adicionales con los mismos datos del caso pero diferentes valores de lab.'],
    [''],
    ['Campos obligatorios: Especialidad, Área, Tema, Idioma, Caso Clínico, Pregunta, Opciones A-D, Respuesta Correcta, Explicaciones A-D'],
    ['Campos opcionales: Resumen, Bibliografía, Labs'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  wsInstr['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones');

  XLSX.writeFile(wb, 'Plantilla_Casos_Clinicos_ENARM.xlsx');
  toast.success('Plantilla descargada correctamente');
}

function validateRow(row: any, index: number): ParsedCase {
  const errors: string[] = [];
  const val = (key: string) => (row[key] || '').toString().trim();

  const specialty = val('Especialidad');
  const area = val('Área');
  const topic = val('Tema');
  const language = val('Idioma (es/en)');
  const caseText = val('Caso Clínico');
  const questionText = val('Pregunta');
  const optionA = val('Opción A');
  const optionB = val('Opción B');
  const optionC = val('Opción C');
  const optionD = val('Opción D');
  const correctAnswer = val('Respuesta Correcta (A/B/C/D)').toUpperCase();
  const difficulty = val('Dificultad (low/medium/high)') || 'medium';

  if (!specialty) errors.push('Especialidad requerida');
  if (!area) errors.push('Área requerida');
  if (!topic) errors.push('Tema requerido');
  if (!['es', 'en'].includes(language)) errors.push('Idioma debe ser "es" o "en"');
  if (!caseText) errors.push('Caso clínico requerido');
  if (!questionText) errors.push('Pregunta requerida');
  if (!optionA || !optionB || !optionC || !optionD) errors.push('Todas las opciones A-D son requeridas');
  if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) errors.push('Respuesta correcta debe ser A, B, C o D');
  if (!['low', 'medium', 'high'].includes(difficulty)) errors.push('Dificultad debe ser low, medium o high');

  return {
    row: index + 2,
    specialty, area, topic, language, caseText, questionText,
    optionA, optionB, optionC, optionD, correctAnswer,
    explanationA: val('Explicación A'),
    explanationB: val('Explicación B'),
    explanationC: val('Explicación C'),
    explanationD: val('Explicación D'),
    summary: val('Resumen'),
    bibliography: val('Bibliografía'),
    difficulty,
    labName: val('Lab - Estudio') || undefined,
    labValue: val('Lab - Valor') || undefined,
    labUnit: val('Lab - Unidad') || undefined,
    labRange: val('Lab - Rango Normal') || undefined,
    errors,
  };
}

const BulkUploadCases = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);
  const [parsedCases, setParsedCases] = useState<ParsedCase[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const totalErrors = parsedCases.filter((c) => c.errors.length > 0).length;
  const validCases = parsedCases.filter((c) => c.errors.length === 0).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    lastFileRef.current = file;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          toast.error('El archivo está vacío o no tiene el formato correcto');
          return;
        }

        const parsed = jsonData.map((row, i) => validateRow(row, i));
        setParsedCases(parsed);
        toast.success(`${parsed.length} filas procesadas`);
      } catch {
        toast.error('Error al leer el archivo. Verifica que sea un archivo Excel válido.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (totalErrors > 0) {
      toast.error('Corrige los errores antes de guardar');
      return;
    }
    const file = lastFileRef.current;
    if (!file) {
      toast.error('Selecciona un archivo Excel');
      return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetch('/api/cases/bulk-upload', { method: 'POST', body: fd });
      const json = (await res.json()) as { data?: { success: number; errors: { row: number; error: string }[] }; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? 'Error al importar');
      }
      const d = json.data!;
      toast.success(`Importados: ${d.success} filas`, {
        description: d.errors.length ? `${d.errors.length} errores (revisa consola)` : undefined,
      });
      if (d.errors.length) console.warn(d.errors);
      setParsedCases([]);
      setFileName('');
      lastFileRef.current = null;
      navigate('/backoffice/cases');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/backoffice/cases')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carga Masiva de Casos</h1>
          <p className="text-muted-foreground">Sube un archivo Excel con múltiples casos clínicos</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={downloadTemplate}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Download className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Descargar Plantilla</h3>
              <p className="text-sm text-muted-foreground">Descarga el formato Excel con ejemplo e instrucciones</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border-2 border-dashed border-primary/30 shadow-md hover:shadow-lg hover:border-primary/60 transition-all cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Subir Archivo Excel</h3>
              <p className="text-sm text-muted-foreground">
                {fileName || 'Selecciona un archivo .xlsx con los casos clínicos'}
              </p>
            </div>
          </CardContent>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
        </Card>
      </div>

      {/* Results */}
      {parsedCases.length > 0 && (
        <>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="outline" className="gap-1 px-3 py-1.5">
              <FileSpreadsheet className="w-4 h-4" /> {parsedCases.length} filas
            </Badge>
            <Badge variant="outline" className="gap-1 px-3 py-1.5 border-success/30 text-success">
              <CheckCircle2 className="w-4 h-4" /> {validCases} válidas
            </Badge>
            {totalErrors > 0 && (
              <Badge variant="outline" className="gap-1 px-3 py-1.5 border-destructive/30 text-destructive">
                <AlertCircle className="w-4 h-4" /> {totalErrors} con errores
              </Badge>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={() => { setParsedCases([]); setFileName(''); }}>
                <Trash2 className="w-4 h-4 mr-2" /> Limpiar
              </Button>
              <Button
                className="gradient-primary border-0 font-semibold gap-2"
                onClick={() => void handleSave()}
                disabled={totalErrors > 0 || importing}
              >
                <Save className="w-4 h-4" /> {importing ? 'Importando…' : `Importar ${validCases} casos`}
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Fila</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Tema</TableHead>
                    <TableHead>Pregunta</TableHead>
                    <TableHead>Resp.</TableHead>
                    <TableHead>Dificultad</TableHead>
                    <TableHead>Labs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedCases.map((c, i) => (
                    <TableRow key={i} className={c.errors.length > 0 ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-mono text-sm">{c.row}</TableCell>
                      <TableCell>
                        {c.errors.length === 0 ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <div className="flex items-start gap-1">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-destructive">{c.errors.join(', ')}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">{c.specialty}</TableCell>
                      <TableCell className="max-w-[100px] truncate">{c.area}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{c.topic}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.questionText}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{c.correctAnswer}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          c.difficulty === 'high' ? 'border-destructive/30 text-destructive' :
                          c.difficulty === 'medium' ? 'border-warning/30 text-warning' :
                          'border-success/30 text-success'
                        }>
                          {c.difficulty === 'high' ? 'Alta' : c.difficulty === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {c.labName ? (
                          <Badge variant="outline" className="text-xs">{c.labName}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default BulkUploadCases;
