import { Menu, ArrowLeftRight, FileDown } from "lucide-react";
import chiselLogo from "../../assets/logo.png";
import type { AppSettings } from "../hooks/useSettings";

export function Header({
  settings,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenExchange,
  onOpenReport,
}: {
  settings: AppSettings;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  onOpenExchange: () => void;
  onOpenReport: () => void;
}) {
  return (
    <header className="bg-primary text-primary-foreground px-4 sm:px-6 py-4 flex flex-wrap sm:flex-nowrap items-center justify-between shadow-lg flex-shrink-0 gap-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-white/15 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={20} />
        </button>

        {settings.logoUrl ? (
          <img src={settings.logoUrl} className="w-8 h-8 sm:w-9 sm:h-9 object-contain bg-white/10 p-1 rounded-lg" alt="Logo" />
        ) : (
          <img src={chiselLogo} className="w-8 h-8 sm:w-9 sm:h-9 object-contain bg-white/10 p-1 rounded-lg" alt="Logo" />
        )}

        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-bold tracking-wider text-white leading-none font-sans">
            {settings.companyName}
          </span>
          <span className="text-[9px] sm:text-[10px] text-white/70 mt-0.5 tracking-wider font-semibold">
            {settings.companySubtitle}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
        <button
          onClick={onOpenExchange}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
        >
          <ArrowLeftRight size={16} />
          <span className="hidden sm:inline">Inter-Company Transfer</span>
          <span className="sm:hidden">Transfer</span>
        </button>
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-all"
        >
          <FileDown size={16} />
          <span className="hidden sm:inline">Monthly Report</span>
          <span className="sm:hidden">Report</span>
        </button>

        <div className="text-right text-sm">
          <div className="text-white/60 text-xs">Today</div>
          <div className="font-mono font-semibold">
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>
    </header>
  );
}
