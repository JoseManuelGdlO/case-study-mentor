import DOMPurify from 'dompurify';
import type { CaseTextFormat } from '@/types';

const SANITIZE: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'blockquote',
    'a',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeClinicalHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE);
}

export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function isRichTextEmpty(html: string): boolean {
  return htmlToPlainText(html).length === 0;
}

export function hintVisible(hint: string | undefined, format: CaseTextFormat): boolean {
  if (hint == null || hint === '') return false;
  if (format === 'html') return !isRichTextEmpty(hint);
  return hint.trim().length > 0;
}
