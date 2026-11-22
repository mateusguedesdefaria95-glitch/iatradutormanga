const DEFAULT_BACKEND = "http://127.0.0.1:8765";
const ALLOWED_PATHS = new Set(["/health", "/ocr", "/translate"]);

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get({ autoSites: [], hoverButton: true }, settings => chrome.storage.sync.set(settings));
});

// As chamadas ao backend saem do service worker, e não da página: assim o backend não
// precisa liberar CORS para sites e nenhum site consegue usar a API local.
async function backendRequest(message) {
  if (!ALLOWED_PATHS.has(message.path)) {
    return { ok: false, status: 0, payload: {}, networkError: "Rota do backend não permitida." };
  }
  const { backendUrl } = await chrome.storage.sync.get({ backendUrl: DEFAULT_BACKEND });
  const base = (backendUrl || DEFAULT_BACKEND).replace(/\/$/, "");
  const hasBody = message.body !== undefined;
  // Mantém o service worker ativo durante OCR/tradução demorados.
  const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(() => {}), 20000);
  try {
    const response = await fetch(base + message.path, {
      method: hasBody ? "POST" : "GET",
      headers: hasBody ? { "Content-Type": "application/json" } : {},
      body: hasBody ? JSON.stringify(message.body) : undefined,
      signal: AbortSignal.timeout(Math.min(message.timeoutMs || 60000, 180000))
    });
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, payload };
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    return {
      ok: false,
      status: 0,
      payload: {},
      networkError: timedOut
        ? "O backend demorou demais para responder."
        : "Não foi possível conectar ao backend. Verifique se ele está em execução."
    };
  } finally {
    clearInterval(keepAlive);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) return false;
  if (message?.type === "OPEN_UPLOAD") {
    chrome.tabs.create({ url: chrome.runtime.getURL("upload.html") });
    sendResponse({ ok: true });
    return false;
  }
  if (message?.type === "BACKEND_REQUEST") {
    backendRequest(message).then(sendResponse);
    return true;
  }
  return false;
});
