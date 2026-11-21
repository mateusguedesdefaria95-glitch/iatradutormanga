export type AppSettings = { sourceLanguage: string; targetLanguage: string; backendUrl: string; quality: string; processing: string };
const defaults: AppSettings = { sourceLanguage: "ja", targetLanguage: "pt-BR", backendUrl: "http://127.0.0.1:8765", quality: "balanced", processing: "hybrid" };
export async function getSettings(): Promise<AppSettings> {
  const stored = await chrome.storage.local.get("settings");
  return { ...defaults, ...(stored.settings || {}) };
}
export async function saveSettings(settings: AppSettings): Promise<void> {
  await chrome.storage.local.set({ settings });
}