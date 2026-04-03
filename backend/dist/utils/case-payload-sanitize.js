import { sanitizeTextField } from './html-sanitize.js';
function sanitizeQuestionLike(q, format) {
    return {
        ...q,
        text: sanitizeTextField(q.text, format),
        summary: sanitizeTextField(q.summary, format),
        bibliography: sanitizeTextField(q.bibliography, format),
        hint: sanitizeTextField(q.hint, format),
        options: q.options.map((o) => ({
            ...o,
            text: sanitizeTextField(o.text, format),
            explanation: sanitizeTextField(o.explanation, format),
        })),
    };
}
export function sanitizeCreateCasePayload(input) {
    const format = input.textFormat;
    return {
        ...input,
        text: sanitizeTextField(input.text, format),
        questions: input.questions.map((q) => sanitizeQuestionLike(q, format)),
    };
}
export function sanitizeUpdateCasePayload(input, existingFormat) {
    const format = input.textFormat ?? existingFormat;
    const out = { ...input };
    if (input.text != null)
        out.text = sanitizeTextField(input.text, format);
    if (input.questions) {
        out.questions = input.questions.map((q) => sanitizeQuestionLike(q, format));
    }
    return out;
}
//# sourceMappingURL=case-payload-sanitize.js.map