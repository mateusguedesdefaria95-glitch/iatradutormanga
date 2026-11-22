const $ = id => document.getElementById(id);
const BACKEND_DEFAULT = "http://127.0.0.1:8765";
const LANGUAGE_CODES = {"Português (Brasil)":"pt-BR","English":"en","Español":"es","日本語":"ja","한국어":"ko","中文":"zh","Français":"fr"};
let file = null;
let previewUrl = null;

function readAsDataUrl(selected) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(selected);
  });
}
async function post(base, path, body, timeoutMs) {
  let response;
  try {
    response = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new Error("Não foi possível conectar ao backend. Verifique se ele está em execução e a URL nas configurações.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.detail === "string" && payload.detail ? payload.detail : "Falha em " + path + " (HTTP " + response.status + ").");
  }
  return payload.result || {};
}
function renderTranslations(items) {
  $("translations").replaceChildren(...items.map(text => {
    const li = document.createElement("li");
    li.textContent = text;
    return li;
  }));
}

$("file").addEventListener("change", () => {
  file = $("file").files[0] || null;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = file ? URL.createObjectURL(file) : null;
  $("original").src = previewUrl || "";
  renderTranslations([]);
  $("status").textContent = "";
});

$("translate").addEventListener("click", async () => {
  if (!file) { $("status").textContent = "Selecione uma imagem primeiro."; return; }
  $("translate").disabled = true;
  try {
    const settings = await chrome.storage.sync.get({ backendUrl: BACKEND_DEFAULT, sourceLanguage: "ja", context: "" });
    const base = (settings.backendUrl || BACKEND_DEFAULT).replace(/\/$/, "");
    $("status").textContent = "Reconhecendo o texto…";
    const ocr = await post(base, "/ocr", { image_data_url: await readAsDataUrl(file), language: settings.sourceLanguage }, 120000);
    const regions = ocr.regions || [];
    const texts = regions.length ? regions.map(region => region.text).filter(Boolean) : (ocr.text ? [ocr.text] : []);
    if (!texts.length) throw new Error("Nenhum texto foi reconhecido na imagem.");
    $("status").textContent = "Traduzindo…";
    const result = await post(base, "/translate", {
      texts,
      source_language: settings.sourceLanguage || "auto",
      target_language: LANGUAGE_CODES[$("language").value] || "pt-BR",
      context: settings.context || ""
    }, 60000);
    renderTranslations(result.translations || []);
    $("status").textContent = "Tradução concluída.";
  } catch (error) {
    $("status").textContent = "Erro: " + (error?.message || "falha desconhecida.");
  } finally {
    $("translate").disabled = false;
  }
});
