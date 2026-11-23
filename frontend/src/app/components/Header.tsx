import { useEffect, useState } from "react";
import { Menu, ArrowLeftRight, Download, FileDown, Tag, BookOpen } from "lucide-react";
import type { AppSettings } from "../hooks/useSettings";

export function Header({
  settings,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenExchange,
  onOpenReport,
  onOpenPrograms,
  onOpenVendors,
}: {
  settings: AppSettings;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  onOpenExchange: () => void;
  onOpenReport: () => void;
  onOpenPrograms?: () => void;
  onOpenVendors?: () => void;
}) {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
  }, []);

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
      return;
    }
    window.alert("To add this app to your home screen, use your browser menu and choose ‘Add to Home Screen’ or ‘Install App’.");
  };

  return (
    <header className="bg-primary text-primary-foreground px-3 sm:px-6 py-2.5 sm:py-4 flex flex-wrap sm:flex-nowrap items-center justify-between shadow-lg flex-shrink-0 gap-2 sm:gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-white/15 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-bold tracking-wider text-white leading-none font-sans">
            {settings.companyName}
          </span>
          <span className="text-[9px] sm:text-[10px] text-white/70 mt-0.5 tracking-wider font-semibold">
            {settings.companySubtitle}
          </span>
        </div>
      </div>

      <div className="grid w-full grid-cols-4 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-3">
        {/* {onOpenPrograms && (
          <button
            onClick={onOpenPrograms}
            className="flex min-h-10 items-center justify-center gap-1.5 sm:gap-2 px-0 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
          >
            <Tag size={16} />
            <span>Project</span>
          </button>
        )} */}
        {onOpenVendors && (
          <button
            onClick={onOpenVendors}
            className="flex min-h-10 items-center justify-center gap-1.5 sm:gap-2 px-0 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Ledgers</span>
          </button>
        )}
        <button
          onClick={installApp}
          className="flex min-h-10 items-center justify-center gap-1.5 sm:gap-2 px-0 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
          title="Add this app to your home screen"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Install App</span>
        </button>
        <button
          onClick={onOpenExchange}
          className="flex min-h-10 items-center justify-center gap-1.5 sm:gap-2 px-0 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
        >
          <ArrowLeftRight size={16} />
          <span className="hidden sm:inline">Inter-Company Transfer</span>
        </button>
        <button
          onClick={onOpenReport}
          className="flex min-h-10 items-center justify-center gap-1.5 sm:gap-2 px-0 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
        >
          <FileDown size={16} />
          <span className="hidden sm:inline">Monthly Report</span>
        </button>

        <div className="hidden text-right text-sm lg:block">
          <div className="text-white/60 text-xs">Today</div>
          <div className="font-mono font-semibold">
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>
    </header>
  );
}
