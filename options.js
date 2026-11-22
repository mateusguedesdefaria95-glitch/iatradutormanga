const $ = id => document.getElementById(id);
chrome.storage.sync.get({
  backendUrl: "http://127.0.0.1:8765",
  sourceLanguage: "ja",
  context: ""
}, settings => {
  $("backendUrl").value = settings.backendUrl;
  $("sourceLanguage").value = settings.sourceLanguage;
  $("context").value = settings.context;
});
$("save").addEventListener("click", async () => {
  const backendUrl = $("backendUrl").value.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(backendUrl)) {
    $("status").textContent = "Informe uma URL válida para o backend.";
    return;
  }
  await chrome.storage.sync.set({
    backendUrl,
    sourceLanguage: $("sourceLanguage").value,
    context: $("context").value.trim()
  });
  $("status").textContent = "Configurações salvas neste navegador.";
});
$("testBackend").addEventListener("click", async () => {
  const base = $("backendUrl").value.trim().replace(/\/$/, "");
  try {
    const response = await fetch(base + "/health");
    const data = await response.json();
    $("status").textContent = response.ok
      ? "Backend conectado — " + data.service + ". Tradução configurada: " + (data.translation_configured ? "sim" : "não") + "."
      : "Backend respondeu com erro HTTP " + response.status + ".";
  } catch {
    $("status").textContent = "Não foi possível conectar. Verifique se o backend está em execução.";
  }
});
