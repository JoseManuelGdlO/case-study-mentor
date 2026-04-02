import { cn } from '@/lib/utils';
import { sanitizeClinicalHtml } from '@/lib/richText';
import type { CaseTextFormat } from '@/types';

type Props = {
  text: string;
  format: CaseTextFormat;
  className?: string;
};

export function RichOrPlainBlock({ text, format, className }: Props) {
  if (format === 'html') {
    const safe = sanitizeClinicalHtml(text);
    return (
      <div
        className={cn('prose prose-sm max-w-none text-foreground [&_a]:text-primary', className)}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }
  return (
    <div className={cn(className)}>
      <p className="leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
