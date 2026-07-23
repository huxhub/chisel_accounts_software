import { Settings, X, Check } from "lucide-react";
import { toast } from "sonner";
import type { AppSettings } from "../../hooks/useSettings";

export function SettingsModal({
  showSettings,
  setShowSettings,
  settings,
  setSettings,
  tempSettings,
  setTempSettings,
}: {
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  settings: AppSettings;
  setSettings: (v: AppSettings) => void;
  tempSettings: AppSettings;
  setTempSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  if (!showSettings) return null;

  const PRESETS = [
    { name: "Brand Red", color: "#c21818" },
    { name: "Navy Blue", color: "#1e3a8a" },
    { name: "Emerald Green", color: "#047857" },
    { name: "Royal Blue", color: "#2563eb" },
    { name: "Charcoal Black", color: "#1f2937" },
    { name: "Dark Plum", color: "#581c87" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[90vh] border border-border/80">
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary to-primary/90 flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner backdrop-blur-xs">
              <Settings size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-wide">Application Settings</h3>
              <p className="text-xs text-white/70">Customize branding & theme</p>
            </div>
          </div>
          <button onClick={() => setShowSettings(false)} className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto bg-gray-50/30">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company Name</label>
            <input
              type="text"
              value={tempSettings.companyName}
              onChange={e => setTempSettings({ ...tempSettings, companyName: e.target.value })}
              placeholder="CHISEL"
              className="w-full border border-border rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent bg-white transition-all shadow-3xs font-semibold text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subtitle / Description</label>
            <input
              type="text"
              value={tempSettings.companySubtitle}
              onChange={e => setTempSettings({ ...tempSettings, companySubtitle: e.target.value })}
              placeholder="Accounts Manager"
              className="w-full border border-border rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent bg-white transition-all shadow-3xs text-foreground"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Primary Theme Color</label>
            <div className="flex items-center gap-4 bg-white p-4 border border-border rounded-xl shadow-3xs">
              <div className="flex items-center gap-3 p-1.5 border border-border rounded-xl bg-gray-50/50 shadow-inner flex-shrink-0">
                <input
                  type="color"
                  value={tempSettings.themeColor}
                  onChange={e => setTempSettings({ ...tempSettings, themeColor: e.target.value })}
                  className="w-10 h-10 border-0 rounded-lg cursor-pointer bg-transparent overflow-hidden shadow-2xs"
                />
              </div>
              <div>
                <span className="font-mono text-sm text-foreground font-bold uppercase tracking-wider block">{tempSettings.themeColor}</span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5 block">Custom brand accent color</span>
              </div>
            </div>

            <div className="bg-white p-4 border border-border rounded-xl shadow-3xs space-y-2.5">
              <label className="block text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Preset Palettes</label>
              <div className="flex flex-wrap gap-2.5">
                {PRESETS.map(preset => {
                  const isSelected = tempSettings.themeColor.toLowerCase() === preset.color.toLowerCase();
                  return (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setTempSettings({ ...tempSettings, themeColor: preset.color })}
                      className={`w-9 h-9 rounded-full border-2 shadow-3xs transition-all hover:scale-110 hover:shadow-xs cursor-pointer flex items-center justify-center ${
                        isSelected ? "border-foreground scale-105" : "border-transparent"
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    >
                      {isSelected && <Check size={14} className="text-white drop-shadow-md font-bold" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border flex gap-3 bg-white">
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setSettings(tempSettings);
              localStorage.setItem("chisel_settings", JSON.stringify(tempSettings));
              setShowSettings(false);
              toast.success("Branding settings saved successfully!");
            }}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-95 hover:scale-[1.01] active:scale-[0.98] shadow-md shadow-accent/15"
            style={{ backgroundColor: tempSettings.themeColor }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
