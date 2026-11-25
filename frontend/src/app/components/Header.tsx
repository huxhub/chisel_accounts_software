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
    <header className="bg-primary text-primary-foreground px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-lg flex-shrink-0 gap-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          className="p-1.5 -ml-1.5 rounded-md hover:bg-white/15 transition-colors shrink-0"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          title={mobileMenuOpen ? "Close sidebar" : "Open sidebar"}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col min-w-0">
          <span className="text-base sm:text-lg font-bold tracking-wider text-white leading-none font-sans truncate">
            {settings.companyName}
          </span>
          <span className="text-[9px] sm:text-[10px] text-white/70 mt-0.5 tracking-wider font-semibold truncate">
            {settings.companySubtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {onOpenVendors && (
          <button
            onClick={onOpenVendors}
            className="flex h-9 sm:h-10 items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0"
            title="Ledgers"
          >
            <BookOpen size={16} className="shrink-0" />
            <span className="hidden sm:inline">Ledgers</span>
          </button>
        )}
        <button
          onClick={installApp}
          className="flex h-9 sm:h-10 items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0"
          title="Add this app to your home screen"
        >
          <Download size={16} className="shrink-0" />
          <span className="hidden sm:inline">Install App</span>
        </button>
        <button
          onClick={onOpenExchange}
          className="flex h-9 sm:h-10 items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0"
          title="Inter-Company Transfer"
        >
          <ArrowLeftRight size={16} className="shrink-0" />
          <span className="hidden sm:inline">
            <span className="hidden xl:inline">Inter-Company </span>Transfer
          </span>
        </button>
        <button
          onClick={onOpenReport}
          className="flex h-9 sm:h-10 items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0"
          title="Monthly Report"
        >
          <FileDown size={16} className="shrink-0" />
          <span className="hidden sm:inline">Monthly Report</span>
        </button>

        <div className="hidden text-right text-sm lg:block pl-2.5 border-l border-white/20 ml-1">
          <div className="text-white/60 text-xs">Today</div>
          <div className="font-mono font-semibold whitespace-nowrap">
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>
    </header>
  );
}
