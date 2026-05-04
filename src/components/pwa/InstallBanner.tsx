import { useEffect, useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function InstallBanner() {
  const { isInstallable, installApp } = usePWAInstall();

  const [show, setShow] = useState(false);

 useEffect(() => {
  if (!isInstallable) return;

  const dismissed = localStorage.getItem("pwa-dismissed");
  if (dismissed) return;

  // show immediately after slight idle delay
  const timer = setTimeout(() => {
    setShow(true);
  }, 800);

  return () => clearTimeout(timer);
}, [isInstallable]);

  const handleInstall = async () => {
    await installApp();
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl bg-black text-white p-4 shadow-xl flex items-center justify-between animate-fade-in">
      <div>
        <p className="font-semibold">Install Ownant App</p>
        <p className="text-xs text-gray-300">
          Faster access • Offline support • Better experience
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="bg-white text-black px-4 py-2 rounded-xl font-semibold"
        >
          Install
        </button>

        <button
          onClick={handleDismiss}
          className="text-gray-300 text-sm px-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}