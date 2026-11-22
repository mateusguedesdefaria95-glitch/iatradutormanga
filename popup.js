const $=id=>document.getElementById(id);
const defaults={autoTranslate:false,scope:"all",targetLanguage:"Português (Brasil)",model:"gpt-4.1-mini",imageScope:"viewport",pretranslate:false,hoverButton:true};
async function load(){const s=await chrome.storage.sync.get(defaults);$("autoTranslate").checked=s.autoTranslate;$("autoState").textContent=s.autoTranslate?"Ativado":"Desativado";document.querySelector(`input[name="scope"][value="${s.scope}"]`).checked=true;$("targetLanguage").value=s.targetLanguage;$("model").value=s.model;$("pretranslate").checked=s.pretranslate;$("hoverButton").checked=s.hoverButton;document.querySelectorAll("[data-scope]").forEach(b=>b.classList.toggle("active",b.dataset.scope===s.imageScope));const p=(await chrome.storage.local.get("mtBatchProgress")).mtBatchProgress;if(p)renderProgress(p);}
async function save(patch){await chrome.storage.sync.set(patch);}
function renderProgress(p){$("batchProgress").max=Math.max(1,p.total||1);$("batchProgress").value=p.completed||0;$("batchState").textContent=p.message||"Aguardando";$("batchCounts").textContent=p.total?`${p.completed}/${p.total} • ${p.succeeded} concluídas • ${p.failed} falhas`:"";}
async function activeTab(){const [tab]=await chrome.tabs.query({active:true,currentWindow:true});return tab;}
$("autoTranslate").addEventListener("change",async e=>{await save({autoTranslate:e.target.checked});$("autoState").textContent=e.target.checked?"Ativado":"Desativado";});
document.querySelectorAll('input[name="scope"]').forEach(x=>x.addEventListener("change",()=>save({scope:x.value})));
$("targetLanguage").addEventListener("change",e=>save({targetLanguage:e.target.value}));
$("model").addEventListener("change",e=>save({model:e.target.value}));
$("pretranslate").addEventListener("change",e=>save({pretranslate:e.target.checked}));
$("hoverButton").addEventListener("change",e=>save({hoverButton:e.target.checked}));
document.querySelectorAll("[data-scope]").forEach(b=>b.addEventListener("click",async()=>{document.querySelectorAll("[data-scope]").forEach(x=>x.classList.remove("active"));b.classList.add("active");await save({imageScope:b.dataset.scope});}));
$("openOptions").onclick=()=>chrome.runtime.openOptionsPage();
$("openUpload").onclick=()=>chrome.tabs.create({url:chrome.runtime.getURL("upload.html")});
$("siteHelp").onclick=()=>$("status").textContent="A extensão funciona em páginas com imagens acessíveis pelo navegador. Alguns leitores usam canvas ou bloqueios de origem.";
$("translatePage").onclick=async()=>{const tab=await activeTab();if(!tab?.id)return;chrome.tabs.sendMessage(tab.id,{type:"TRANSLATE_PAGE"},r=>{$("status").textContent=chrome.runtime.lastError?"Atualize a página e tente novamente.":(r?.message||"Solicitação enviada.");});};
$("translateAll").onclick=async()=>{const tab=await activeTab();if(!tab?.id)return;$("translateAll").disabled=true;$("status").textContent="Iniciando fila…";chrome.tabs.sendMessage(tab.id,{type:"TRANSLATE_ALL"},r=>{if(chrome.runtime.lastError){$("status").textContent="Não foi possível acessar a página. Atualize-a e tente novamente.";}else if(r){renderProgress({...r,running:false,message:r.cancelled?"Lote cancelado.":"Lote finalizado."});}$("translateAll").disabled=false;});};
$("cancelBatch").onclick=async()=>{const tab=await activeTab();if(tab?.id)chrome.tabs.sendMessage(tab.id,{type:"CANCEL_BATCH"},()=>{});$("batchState").textContent="Solicitando cancelamento…";};
$("restorePage").onclick=async()=>{const tab=await activeTab();if(tab?.id)chrome.tabs.sendMessage(tab.id,{type:"RESTORE_PAGE"});$("status").textContent="Solicitação de restauração enviada.";};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==="local"&&changes.mtBatchProgress)renderProgress(changes.mtBatchProgress.newValue||{});});
load();
