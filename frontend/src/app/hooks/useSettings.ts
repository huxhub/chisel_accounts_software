import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../services/config";

export interface AppSettings {
  companyName: string;
  companySubtitle: string;
  logoUrl: string;
  themeColor: string;
}

const DEFAULTS: AppSettings = {
  companyName: "GOLDEN CATCH",
  companySubtitle: "Accounts Manager",
  logoUrl: "",
  themeColor: "#c21818",
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [tempSettings, setTempSettings] = useState<AppSettings>(DEFAULTS);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/branding`)
      .then(response => { if (!response.ok) throw new Error('Unable to load branding'); return response.json(); })
      .then(data => { if (data) setSettings({ ...DEFAULTS, ...data }); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", settings.themeColor);
    document.documentElement.style.setProperty("--accent", settings.themeColor);
  }, [settings.themeColor]);

  return { settings, setSettings, tempSettings, setTempSettings, showSettings, setShowSettings };
}
