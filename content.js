const originals = new WeakMap();
let hoverEnabled = true;
let busy = false;
let batchCancelled = false;
let scanTimer = null;
const LANGUAGE_CODES = {"Português (Brasil)":"pt-BR","English":"en","Español":"es","日本語":"ja","한국어":"ko","中文":"zh","Français":"fr"};
const MAX_PNG_CHARS = 12 * 1024 * 1024; // acima disso o PNG tende a passar do limite de 12 MB do backend

chrome.storage.sync.get({ hoverButton: true, autoSites: [] }, settings => {
  hoverEnabled = settings.hoverButton;
  scanImages();
  if (settings.autoSites.includes(location.hostname)) translateAll();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.hoverButton) {
    hoverEnabled = changes.hoverButton.newValue;
    if (hoverEnabled) scanImages();
  }
  if (changes.autoSites) {
    const before = changes.autoSites.oldValue || [];
    const after = changes.autoSites.newValue || [];
    if (after.includes(location.hostname) && !before.includes(location.hostname)) translateAll();
  }
});

function eligible(img) {
  return img instanceof HTMLImageElement && img.complete &&
    img.naturalWidth > 140 && img.naturalHeight > 140 &&
    !img.dataset.mtProcessed && !img.dataset.mtBusy;
}
function addHoverButton(img) {
  if (!hoverEnabled || img.parentElement?.querySelector(":scope > .mt-hover")) return;
  const parent = img.parentElement;
  if (!parent) return;
  if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
  const button = document.createElement("button");
  button.className = "mt-hover";
  button.textContent = "Traduzir";
  button.type = "button";
  button.addEventListener("click", event => {
    event.preventDefault(); event.stopPropagation(); translateImage(img, true);
  });
  parent.appendChild(button);
}
function scanImages() {
  document.querySelectorAll("img").forEach(img => { if (eligible(img)) addHoverButton(img); });
}
function scheduleScan() {
  if (scanTimer) return;
  scanTimer = setTimeout(() => { scanTimer = null; scanImages(); }, 300);
}
function toDataUrl(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas indisponível.");
    context.drawImage(img, 0, 0);
    const png = canvas.toDataURL("image/png");
    return png.length > MAX_PNG_CHARS ? canvas.toDataURL("image/jpeg", 0.9) : png;
  } catch {
    throw new Error("Imagem protegida por CORS. Este leitor não permite capturar a imagem diretamente.");
  }
}
function languageCode(label) {
  return LANGUAGE_CODES[label] || "pt-BR";
}
function detailMessage(payload, fallback) {
  return typeof payload?.detail === "string" && payload.detail ? payload.detail : fallback;
}
async function callBackend(path, body, timeoutMs) {
  let reply;
  try {
    reply = await chrome.runtime.sendMessage({ type: "BACKEND_REQUEST", path, body, timeoutMs });
  } catch {
    throw new Error("A extensão foi atualizada ou reiniciada. Recarregue a página e tente novamente.");
  }
  if (!reply) throw new Error("A extensão não respondeu. Recarregue a página e tente novamente.");
  if (reply.networkError) throw new Error(reply.networkError);
  return reply;
}
function showTranslation(img, translations) {
  let panel = img.parentElement?.querySelector(":scope > .mt-translation");
  if (!panel) { panel = document.createElement("div"); panel.className = "mt-translation"; img.parentElement?.appendChild(panel); }
  panel.replaceChildren();
  const title = document.createElement("strong"); title.textContent = "Tradução"; panel.appendChild(title);
  translations.forEach(text => { const p = document.createElement("p"); p.textContent = text; panel.appendChild(p); });
}
async function translateImage(img, showAlert = false) {
  if (busy || !eligible(img)) return {ok:false,error:"Imagem já processada ou em processamento."};
  busy = true; img.dataset.mtBusy = "1";
  try {
    const settings = await chrome.storage.sync.get({sourceLanguage:"ja",targetLanguage:"Português (Brasil)",context:""});
    const imageData = toDataUrl(img);
    const ocr = await callBackend("/ocr", {image_data_url:imageData,language:settings.sourceLanguage}, 120000);
    if (!ocr.ok) throw new Error(detailMessage(ocr.payload, "Falha no OCR (HTTP "+ocr.status+")."));
    const regions = ocr.payload.result?.regions || [];
    const texts = regions.length ? regions.map(r=>r.text).filter(Boolean) : (ocr.payload.result?.text ? [ocr.payload.result.text] : []);
    if (!texts.length) throw new Error("Nenhum texto foi reconhecido na imagem.");
    const tr = await callBackend("/translate", {texts,source_language:settings.sourceLanguage||"auto",target_language:languageCode(settings.targetLanguage),context:settings.context||""}, 60000);
    if (!tr.ok) throw new Error(detailMessage(tr.payload, "Falha na tradução (HTTP "+tr.status+")."));
    showTranslation(img,tr.payload.result?.translations || []);
    img.dataset.mtProcessed = "1";
    return {ok:true};
  } catch(error) {
    const message=error?.message || "Não foi possível traduzir esta imagem.";
    if(showAlert) alert("MangaTradutor AI: "+message);
    return {ok:false,error:message};
  } finally { delete img.dataset.mtBusy; busy=false; }
}
async function saveBatchProgress(progress) {
  await chrome.storage.local.set({mtBatchProgress:progress});
}
async function translateAll() {
  if (busy) return {ok:false,message:"Já existe uma tradução em andamento."};
  batchCancelled=false;
  scanImages();
  const images=[...document.querySelectorAll("img")].filter(eligible);
  const total=images.length;
  let completed=0, succeeded=0, failed=0;
  await saveBatchProgress({running:true,cancelled:false,total,completed,succeeded,failed,current:0,message:total?"Preparando fila…":"Nenhuma imagem elegível encontrada."});
  for(let i=0;i<images.length;i++){
    if(batchCancelled) break;
    const img=images[i];
    await saveBatchProgress({running:true,cancelled:false,total,completed,succeeded,failed,current:i+1,message:"Traduzindo imagem "+(i+1)+" de "+total});
    const result=await translateImage(img,false);
    completed++;
    if(result.ok) succeeded++; else failed++;
    await saveBatchProgress({running:true,cancelled:false,total,completed,succeeded,failed,current:i+1,message:result.ok?"Imagem "+(i+1)+" concluída.":"Imagem "+(i+1)+" falhou: "+result.error});
  }
  const cancelled=batchCancelled;
  await saveBatchProgress({running:false,cancelled,total,completed,succeeded,failed,current:completed,message:cancelled?"Processamento cancelado.":(total?"Lote concluído.":"Nenhuma imagem elegível encontrada.")});
  return {ok:true,total,completed,succeeded,failed,cancelled};
}
function restore() {
  document.querySelectorAll(".mt-translation").forEach(p=>p.remove());
  document.querySelectorAll("img[data-mt-processed]").forEach(img=>delete img.dataset.mtProcessed);
}
const observer=new MutationObserver(scheduleScan);
observer.observe(document.documentElement,{childList:true,subtree:true});
// Imagens carregadas depois (lazy load) não alteram o DOM; o evento load não borbulha, então usamos captura.
document.addEventListener("load",event=>{if(event.target instanceof HTMLImageElement)scheduleScan();},true);
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(message.type==="TRANSLATE_PAGE"){scanImages();sendResponse({message:"Imagens detectadas. Use Traduzir tudo para processar a fila ou o botão em uma imagem."});}
  else if(message.type==="TRANSLATE_ALL"){translateAll().then(sendResponse);return true;}
  else if(message.type==="CANCEL_BATCH"){batchCancelled=true;sendResponse({ok:true,message:"Cancelamento solicitado."});}
  else if(message.type==="RESTORE_PAGE"){restore();sendResponse({message:"Traduções sobrepostas removidas."});}
});
const style=document.createElement("style");
style.textContent=`.mt-hover{position:absolute;z-index:2147483646;right:8px;top:8px;background:#f06419;color:#fff;border:0;border-radius:18px;padding:8px 12px;font:600 12px Arial;cursor:pointer;box-shadow:0 2px 8px #0004}.mt-translation{position:relative;z-index:2147483645;background:#fff;color:#171717;border:1px solid #f06419;border-radius:8px;padding:10px 12px;margin:8px 0;font:14px/1.5 Arial;max-height:240px;overflow:auto;box-shadow:0 2px 10px #0002}.mt-translation strong{color:#d94f0b}.mt-translation p{margin:6px 0}`;
document.documentElement.appendChild(style);
