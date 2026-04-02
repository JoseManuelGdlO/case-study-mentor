import sanitizeHtml from 'sanitize-html';
import type { CaseTextFormat } from '@prisma/client';

const clinicalCaseHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: [
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
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export function sanitizeHtmlFragment(value: string): string {
  return sanitizeHtml(value, clinicalCaseHtmlOptions);
}

export function sanitizeTextField(value: string, format: CaseTextFormat): string {
  if (format === 'html') return sanitizeHtmlFragment(value);
  return value;
}
