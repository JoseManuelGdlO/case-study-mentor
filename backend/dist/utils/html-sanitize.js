import sanitizeHtml from 'sanitize-html';
const clinicalCaseHtmlOptions = {
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
export function sanitizeHtmlFragment(value) {
    return sanitizeHtml(value, clinicalCaseHtmlOptions);
}
export function sanitizeTextField(value, format) {
    if (format === 'html')
        return sanitizeHtmlFragment(value);
    return value;
}
//# sourceMappingURL=html-sanitize.js.map