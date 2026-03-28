import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, ChevronDown } from 'lucide-react';
import type { LabResult } from '@/types';
import { useState } from 'react';

interface LabResultsAccordionProps {
  labs: LabResult[];
}

const isAbnormal = (lab: LabResult): boolean => {
  const match = lab.normalRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (!match) return false;
  const val = parseFloat(lab.value);
  return val < parseFloat(match[1]) || val > parseFloat(match[2]);
};

const LabResultsAccordion = ({ labs }: LabResultsAccordionProps) => {
  const [open, setOpen] = useState(false);

  if (!labs || labs.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border-2 border-border overflow-hidden">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">Laboratorios</span>
          <Badge variant="secondary" className="text-xs">{labs.length}</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border">
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
          <p className="text-xs text-muted-foreground px-3 py-2 border-t border-border">
            Los valores en <span className="text-destructive font-semibold">rojo</span> están fuera del rango normal.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default LabResultsAccordion;
