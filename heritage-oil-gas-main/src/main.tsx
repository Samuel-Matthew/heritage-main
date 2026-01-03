import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "react-hot-toast";

// Add cache-busting for favicon
const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
if (link && link.href.includes("favicon")) {
  link.href = link.href + `?t=${Date.now()}`;
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Toaster position="top-right" />
    <App />
  </HelmetProvider>
);
