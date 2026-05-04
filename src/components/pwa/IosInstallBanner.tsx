import { isIOS } from "@/lib/isIOS";

export default function IosInstallBanner() {
  if (!isIOS()) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-black text-white p-4 rounded-2xl shadow-xl">
      <p className="font-semibold">Install Ownant App</p>

      <p className="text-sm text-gray-300 mt-1">
        1. Tap <b>Share</b> (⬆️) <br />
        2. Scroll down <br />
        3. Tap <b>Add to Home Screen</b>
      </p>
    </div>
  );
}