import { useState, useEffect } from 'react';
import { mockExamDates } from '@/data/examDatesData';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const activeExam = mockExamDates.find((d) => d.isActive);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!activeExam) return;
    const calculate = () => {
      const diff = new Date(activeExam.date).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [activeExam]);

  if (!activeExam || !timeLeft) return null;

  const units = [
    { label: 'Días', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Seg', value: timeLeft.seconds },
  ];

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center">
          <div className="gradient-primary p-4 sm:p-5 flex items-center gap-3 w-full sm:w-auto">
            <CalendarClock className="w-6 h-6 text-primary-foreground" />
            <div className="text-primary-foreground">
              <p className="font-bold text-sm">{activeExam.name}</p>
              <p className="text-xs opacity-80">Cuenta regresiva</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 p-4 sm:px-8">
            {units.map((u) => (
              <div key={u.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums leading-none">
                  {String(u.value).padStart(2, '0')}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-wider">{u.label}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountdownTimer;
