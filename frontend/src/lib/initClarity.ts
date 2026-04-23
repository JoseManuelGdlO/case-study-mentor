/**
 * Microsoft Clarity — heatmaps and session replay when VITE_CLARITY_PROJECT_ID is set.
 * Create a project at https://clarity.microsoft.com/ and link GA4 in the Clarity UI.
 */
export function initClarity(): void {
  const id = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim();
  if (!id) return;

  (function (c: Window, l: Document, a: string, r: string, i: string) {
    type ClarityFn = { (this: unknown): void; q?: IArguments[] };
    const w = c as Window & Record<string, ClarityFn | undefined>;
    w[a] =
      w[a] ||
      function (this: unknown) {
        (w[a]!.q = w[a]!.q || []).push(arguments);
      };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = "https://www.clarity.ms/tag/" + i;
    const y = l.getElementsByTagName(r)[0];
    y?.parentNode?.insertBefore(t, y);
  })(window, document, "clarity", "script", id);
}
