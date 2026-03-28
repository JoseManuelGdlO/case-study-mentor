import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';
import type { LabResult } from '@/types';

interface LabResultsDialogProps {
  labs: LabResult[];
}

const isAbnormal = (lab: LabResult): boolean => {
  const match = lab.normalRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (!match) return false;
  const val = parseFloat(lab.value);
  return val < parseFloat(match[1]) || val > parseFloat(match[2]);
};

const LabResultsDialog = ({ labs }: LabResultsDialogProps) => {
  if (!labs || labs.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FlaskConical className="w-4 h-4 text-primary" /> Laboratorios
          <Badge variant="secondary" className="ml-1 text-xs">{labs.length}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> Resultados de Laboratorio
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-semibold text-foreground">Estudio</th>
                <th className="text-center p-3 font-semibold text-foreground">Resultado</th>
                <th className="text-center p-3 font-semibold text-foreground">Rango Normal</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab) => {
                const abnormal = isAbnormal(lab);
                return (
                  <tr key={lab.id} className="border-t border-border">
                    <td className="p-3 text-foreground font-medium">{lab.name}</td>
                    <td className={`p-3 text-center font-bold ${abnormal ? 'text-destructive' : 'text-success'}`}>
                      {lab.value} {lab.unit && <span className="font-normal text-muted-foreground text-xs">{lab.unit}</span>}
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{lab.normalRange} {lab.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Los valores en <span className="text-destructive font-semibold">rojo</span> están fuera del rango normal.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LabResultsDialog;
