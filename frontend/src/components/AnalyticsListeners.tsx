import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { GA4_MEASUREMENT_ID } from "@/lib/analyticsConstants";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * SPA page_path updates for GA4 (avoids duplicate first pageview vs index.html).
 * Delegated ui_click for elements with data-ga-click="stable_id".
 */
export function AnalyticsListeners() {
  const location = useLocation();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (prevPath.current === null) {
      prevPath.current = path;
      return;
    }
    if (prevPath.current === path) return;
    prevPath.current = path;
    window.gtag?.("config", GA4_MEASUREMENT_ID, { page_path: path });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const raw = (e.target as Element | null)?.closest?.("[data-ga-click]");
      if (!raw) return;
      const name = raw.getAttribute("data-ga-click")?.trim();
      if (!name || !window.gtag) return;
      window.gtag("event", "ui_click", {
        click_id: name,
        page_path: `${window.location.pathname}${window.location.search}`,
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
