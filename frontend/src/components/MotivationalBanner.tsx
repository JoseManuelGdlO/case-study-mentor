import { useState, useEffect } from 'react';
import { mockPhrases } from '@/data/phrasesData';
import { Sparkles } from 'lucide-react';

const ROTATE_INTERVAL = 10000; // 10 seconds

const MotivationalBanner = () => {
  const activePhrases = mockPhrases.filter((p) => p.isActive);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (activePhrases.length <= 1) return;
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % activePhrases.length);
        setFade(true);
      }, 400);
    }, ROTATE_INTERVAL);
    return () => clearInterval(interval);
  }, [activePhrases.length]);

  if (!activePhrases.length) return null;

  const phrase = activePhrases[index % activePhrases.length];

  return (
    <div className="rounded-xl gradient-primary p-4 flex items-center gap-3 text-primary-foreground">
      <Sparkles className="w-5 h-5 flex-shrink-0 opacity-80" />
      <p
        className={`text-sm font-medium italic transition-opacity duration-400 ${fade ? 'opacity-100' : 'opacity-0'}`}
      >
        "{phrase.text}"
        {phrase.author && <span className="not-italic opacity-70 ml-2">— {phrase.author}</span>}
      </p>
    </div>
  );
};

export default MotivationalBanner;
