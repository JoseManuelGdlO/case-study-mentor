import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { subscribeApiSlowLoading } from "@/lib/api";

export function ApiSlowLoadingOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeApiSlowLoading(setVisible), []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center bg-background/55 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
