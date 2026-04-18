import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { initClarity } from "@/lib/initClarity";
import "./index.css";

initClarity();
import faviconUrl from "./assets/logotiposolo.ico?url";

const link =
  document.querySelector<HTMLLinkElement>("link[rel='icon']") ?? document.createElement("link");
link.rel = "icon";
link.type = "image/x-icon";
link.href = faviconUrl;
if (!link.parentElement) document.head.appendChild(link);

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
