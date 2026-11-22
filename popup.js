const $ = id => document.getElementById(id);
const defaults = { targetLanguage: "Português (Brasil)", hoverButton: true, autoSites: [] };

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}
function hostOf(tab) {
  try {
    const url = new URL(tab?.url || "");
    return url.protocol === "http:" || url.protocol === "https:" ? url.hostname : "";
  } catch {
    return "";
  }
}
function renderAuto(host, enabled) {
  $("autoTranslate").checked = enabled;
  $("autoTranslate").disabled = !host;
  $("autoState").textContent = !host ? "Indisponível nesta página" : (enabled ? "Ativado em " + host : "Desativado");
}
function renderProgress(p) {
  $("batchProgress").max = Math.max(1, p.total || 1);
  $("batchProgress").value = p.completed || 0;
  $("batchState").textContent = p.message || "Aguardando";
  $("batchCounts").textContent = p.total ? `${p.completed}/${p.total} • ${p.succeeded} concluídas • ${p.failed} falhas` : "";
}
async function load() {
  const settings = await chrome.storage.sync.get(defaults);
  $("targetLanguage").value = settings.targetLanguage;
  $("hoverButton").checked = settings.hoverButton;
  const host = hostOf(await activeTab());
  renderAuto(host, !!host && settings.autoSites.includes(host));
  const progress = (await chrome.storage.local.get("mtBatchProgress")).mtBatchProgress;
  if (progress) renderProgress(progress);
}

$("autoTranslate").addEventListener("change", async event => {
  const host = hostOf(await activeTab());
  if (!host) return;
  const { autoSites } = await chrome.storage.sync.get({ autoSites: [] });
  const sites = new Set(autoSites);
  if (event.target.checked) sites.add(host); else sites.delete(host);
  await chrome.storage.sync.set({ autoSites: [...sites] });
  renderAuto(host, event.target.checked);
});
$("targetLanguage").addEventListener("change", event => chrome.storage.sync.set({ targetLanguage: event.target.value }));
$("hoverButton").addEventListener("change", event => chrome.storage.sync.set({ hoverButton: event.target.checked }));
$("openOptions").onclick = () => chrome.runtime.openOptionsPage();
$("openUpload").onclick = () => chrome.tabs.create({ url: chrome.runtime.getURL("upload.html") });
$("siteHelp").onclick = () => {
  $("status").textContent = "A extensão funciona em páginas com imagens acessíveis pelo navegador. Alguns leitores usam canvas ou bloqueios de origem.";
};
$("translatePage").onclick = async () => {
  const tab = await activeTab();
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "TRANSLATE_PAGE" }, response => {
    $("status").textContent = chrome.runtime.lastError ? "Atualize a página e tente novamente." : (response?.message || "Solicitação enviada.");
  });
};
$("translateAll").onclick = async () => {
  const tab = await activeTab();
  if (!tab?.id) return;
  $("translateAll").disabled = true;
  $("status").textContent = "Iniciando fila…";
  chrome.tabs.sendMessage(tab.id, { type: "TRANSLATE_ALL" }, response => {
    if (chrome.runtime.lastError) {
      $("status").textContent = "Não foi possível acessar a página. Atualize-a e tente novamente.";
    } else if (response) {
      renderProgress({ ...response, running: false, message: response.cancelled ? "Lote cancelado." : "Lote finalizado." });
    }
    $("translateAll").disabled = false;
  });
};
$("cancelBatch").onclick = async () => {
  const tab = await activeTab();
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "CANCEL_BATCH" }, () => void chrome.runtime.lastError);
  $("batchState").textContent = "Solicitando cancelamento…";
};
$("restorePage").onclick = async () => {
  const tab = await activeTab();
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: "RESTORE_PAGE" }, () => void chrome.runtime.lastError);
  $("status").textContent = "Painéis de tradução removidos.";
};
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.mtBatchProgress) renderProgress(changes.mtBatchProgress.newValue || {});
});
load();
