import { useState, useEffect } from "react";
import chiselLogo from "../../assets/logo.png";

export interface AppSettings {
  companyName: string;
  companySubtitle: string;
  logoUrl: string;
  themeColor: string;
}

const DEFAULTS: AppSettings = {
  companyName: "CHISEL",
  companySubtitle: "Accounts Manager",
  logoUrl: chiselLogo,
  themeColor: "#c21818",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("chisel_settings");
    if (saved) {
      try {
        return { ...DEFAULTS, ...JSON.parse(saved) };
      } catch {
        return DEFAULTS;
      }
    }
    return DEFAULTS;
  });
  const [tempSettings, setTempSettings] = useState<AppSettings>({ ...settings });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", settings.themeColor);
    root.style.setProperty("--accent", settings.themeColor);
  }, [settings.themeColor]);

  return {
    settings,
    setSettings,
    tempSettings,
    setTempSettings,
    showSettings,
    setShowSettings,
  };
}
