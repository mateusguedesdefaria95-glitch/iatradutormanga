# Etapa 7 — Segurança do backend local e limpeza da interface

## Implementado
- **CORS fechado por padrão.** `MANGA_ALLOWED_ORIGINS` agora vem vazio: nenhum site consegue ler respostas do backend. Antes o padrão era `*`, o que permitia que qualquer página aberta no navegador usasse a API local e consumisse créditos do provedor de tradução.
- **Chamadas pelo service worker.** O `content.js` não faz mais `fetch` direto; ele envia `BACKEND_REQUEST` ao `background.js`, que chama o backend (`/health`, `/ocr` e `/translate`, nada além disso). Como `127.0.0.1:8765` está em `host_permissions`, essas chamadas não dependem de CORS.
- **Validação da URL do provedor.** A checagem agora usa o host da URL: aceita HTTPS, ou HTTP apenas para `127.0.0.1` e `localhost`. O teste anterior (`startswith`) também aceitava, por exemplo, `http://127.0.0.1.exemplo.com`.
- **Imagens grandes.** Se o PNG exportado pelo canvas for grande demais, a captura usa JPEG (qualidade 0,9) para ficar abaixo do limite de 12 MB do backend.
- **Menos trabalho no content script.** A varredura de imagens agora tem debounce de 300 ms e também roda quando uma imagem termina de carregar (lazy load).
- **Tradução automática por site.** A opção "Traduzir este site automaticamente" do popup passou a valer só para o site da aba ativa (lista `autoSites` no `chrome.storage.sync`). Ao abrir uma página de um site marcado, o lote é iniciado sozinho.
- **Popup enxuto.** Foram removidas as opções que eram salvas e nunca usadas: modelo, alcance das imagens, pré-traduzir e escopo do site. O modelo continua sendo definido em `MANGA_TRANSLATION_MODEL` no backend.
- **Página de envio refeita.** `upload.html` agora usa `POST /ocr` e `POST /translate` com a URL, o idioma original e o contexto das configurações, e mostra as traduções em lista ao lado da imagem original. Não existe mais campo de chave de API na extensão.
- **Versões alinhadas.** Extensão da raiz e API do backend em 0.7.0.

## Backend em outra URL ou com CORS
Com a URL padrão, nada precisa ser configurado. Se usar outra URL de backend (sem permissão no manifest), o navegador volta a aplicar CORS: defina `MANGA_ALLOWED_ORIGINS=chrome-extension://<id-da-extensão>` (várias origens separadas por vírgula). Não use `*` em um backend que tenha chave de provedor configurada.

## Testes novos
- URL do provedor rejeitada quando usa HTTP externo, esquema diferente de HTTP(S) ou domínio que apenas começa com `127.0.0.1`.
- Requisição de preflight de um site qualquer não recebe `access-control-allow-origin`.

## Limitações
- Esta etapa foi verificada por checagem de sintaxe e de referências entre arquivos, mais um teste isolado da regra de URL. Os testes de `pytest` e o comportamento no navegador ainda precisam ser executados.
- A tradução automática só processa imagens já carregadas quando a página termina de abrir; imagens que aparecem depois só são traduzidas pelo botão ou por **Traduzir tudo**.
- A tradução continua exibida em painel abaixo da imagem; a detecção de balões e o OCR por região seguem pendentes (ver `ROADMAP.md`).
- A pasta `extension/` (React/Vite) segue incompleta.
