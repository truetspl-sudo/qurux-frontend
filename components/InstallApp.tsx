"use client";

import { useState, useEffect } from "react";

/**
 * Floating "Download QURUX" button that triggers the browser's
 * native Add to Home Screen / PWA install prompt.
 * Shows only when the browser supports it (Chrome, Edge, etc.)
 * and the user hasn't already dismissed it.
 */
export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    try {
      if (localStorage.getItem("qurux_install_dismissed") === "1") {
        setDismissed(true);
        return;
      }
    } catch {}

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If already installed (standalone), hide
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setVisible(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    setInstalling(false);
    if (outcome === "dismissed") {
      try { localStorage.setItem("qurux_install_dismissed", "1"); } catch {}
    }
  }

  function handleDismiss() {
    setVisible(false);
    setDismissed(true);
    try { localStorage.setItem("qurux_install_dismissed", "1"); } catch {}
  }

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6">
      {/* Install Card */}
      <div className="animate-bounce rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-pink-100 sm:p-5" style={{ animationDuration: "3s" }}>
        {/* Close */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500 hover:bg-gray-200"
        >
          ×
        </button>

        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg">
            <span className="text-2xl font-black text-white" style={{ fontFamily: "'Great Vibes', cursive" }}>
              Q
            </span>
          </div>

          <div className="flex-1">
            <p className="text-sm font-black text-gray-900">Download QURUX App</p>
            <p className="mt-0.5 text-xs text-gray-500">Home screen pe add karein — quick access!</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="mt-3 w-full rounded-full bg-pink-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-pink-700 disabled:opacity-50"
        >
          {installing ? "Installing..." : "📲 Add to Home Screen"}
        </button>
      </div>
    </div>
  );
}
