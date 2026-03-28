import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';

interface TourStep {
  selector: string;
  title: string;
  description: string;
}

const tourSteps: TourStep[] = [
  { selector: '[data-tour="new-exam"]', title: '📝 Nuevo Examen', description: 'Aquí puedes crear un examen personalizado con las preguntas y especialidades que quieras.' },
  { selector: '[data-tour="dashboard"]', title: '🏠 Tu Dashboard', description: 'Este es tu panel principal donde verás tu progreso y exámenes recientes.' },
  { selector: '[data-tour="countdown"]', title: '⏰ Cuenta regresiva', description: 'Aquí verás cuánto falta para el próximo ENARM. ¡No pierdas la cuenta!' },
  { selector: '[data-tour="exams"]', title: '📚 Mis Exámenes', description: 'Consulta todos tus exámenes creados y continúa donde te quedaste.' },
  { selector: '[data-tour="stats"]', title: '📊 Estadísticas', description: 'Revisa tu rendimiento por especialidad y tu evolución a lo largo del tiempo.' },
  { selector: '[data-tour="subscription"]', title: '👑 Suscripción', description: 'Desbloquea el acceso completo a todos los casos clínicos y funcionalidades PRO.' },
];

interface Rect { top: number; left: number; width: number; height: number; }

const OnboardingTour = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updateRect = useCallback(() => {
    const el = document.querySelector(tourSteps[step].selector);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
  }, [step]);

  useEffect(() => {
    // Small delay to let DOM settle
    const t = setTimeout(updateRect, 150);
    window.addEventListener('resize', updateRect);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateRect); };
  }, [updateRect]);

  const next = () => {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else onComplete();
  };

  const current = tourSteps[step];
  const pad = 8;

  // Tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    const tooltipW = 340;
    const spaceRight = window.innerWidth - (rect.left + rect.width + pad);
    const spaceBelow = window.innerHeight - (rect.top + rect.height + pad);

    if (spaceBelow > 220) {
      return { top: rect.top + rect.height + pad + 12, left: Math.max(16, Math.min(rect.left, window.innerWidth - tooltipW - 16)) };
    }
    if (spaceRight > tooltipW + 20) {
      return { top: Math.max(16, rect.top), left: rect.left + rect.width + pad + 12 };
    }
    // fallback: above
    return { top: Math.max(16, rect.top - 200), left: Math.max(16, Math.min(rect.left, window.innerWidth - tooltipW - 16)) };
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* SVG overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - pad} y={rect.top - pad}
                width={rect.width + pad * 2} height={rect.height + pad * 2}
                rx="12" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tour-mask)" />
      </svg>

      {/* Spotlight border glow */}
      {rect && (
        <div
          className="absolute rounded-xl border-2 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)] pointer-events-none transition-all duration-300"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
        />
      )}

      {/* Click blocker */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-10 w-[340px] bg-card border border-border rounded-2xl shadow-2xl p-5 transition-all duration-300 animate-fade-in"
        style={getTooltipStyle()}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-medium">Paso {step + 1} de {tourSteps.length}</span>
          <button onClick={onComplete} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full mb-4">
          <div className="h-1.5 rounded-full gradient-primary transition-all duration-300" style={{ width: `${((step + 1) / tourSteps.length) * 100}%` }} />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{current.title}</h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{current.description}</p>
        <div className="flex items-center justify-between">
          <button onClick={onComplete} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Omitir tour
          </button>
          <Button className="gradient-primary border-0 gap-2 font-semibold" onClick={next}>
            {step < tourSteps.length - 1 ? <><span>Siguiente</span><ArrowRight className="w-4 h-4" /></> : 'Comenzar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
