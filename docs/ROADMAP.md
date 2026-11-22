# Roadmap — MangaTradutor AI

Visão geral do desenvolvimento. Cada etapa concluída tem um documento próprio em `docs/ETAPA_N.md`.

## Etapas concluídas

| Etapa | Entrega | Documento |
|---|---|---|
| 3 | OCR inicial (manga-ocr e EasyOCR) e pipeline de imagem | `ETAPA_3.md` |
| 4 | Endpoint `POST /translate` com provedor compatível com OpenAI | `ETAPA_4.md` |
| 5 | Integração da extensão com OCR e tradução | `ETAPA_5.md` |
| 6 | Fila de tradução em lote com progresso e cancelamento | `ETAPA_6.md` |

## Pendências conhecidas (levantadas na revisão da v0.6.0)

Ordenadas por prioridade sugerida.

### 1. Segurança do backend local
- O CORS padrão é `*` (`MANGA_ALLOWED_ORIGINS`). Qualquer site aberto no navegador pode chamar `127.0.0.1:8765` e consumir créditos do provedor de tradução.
- Caminho sugerido: fazer as chamadas pelo service worker da extensão (o `host_permissions` já cobre o backend) e restringir o CORS à origem da extensão, ou exigir um token compartilhado.
- A validação da URL do provedor usa `startswith("http://127.0.0.1")`, que também aceita domínios como `127.0.0.1.exemplo.com`. Trocar por uma checagem do host.

### 2. Configurações do popup sem efeito
- `model`, `imageScope`, `pretranslate` e `scope` são gravados, mas nenhum código os lê. O modelo real vem de `MANGA_TRANSLATION_MODEL` no backend.
- `autoTranslate` apenas adiciona os botões "Traduzir"; não traduz sozinho.
- Decidir entre implementar cada opção ou removê-la da interface.

### 3. Página de envio de imagens (`upload.html`)
- Lê `apiUrl` e `apiKey` do `chrome.storage.sync`, que nenhuma tela grava, e espera um campo `translatedImage` que o backend não devolve.
- Guardar chave de API na extensão contraria a regra do projeto. Reescrever para usar `POST /ocr` + `POST /translate` com `backendUrl`, ou remover a página.

### 4. Qualidade do OCR japonês
- A página inteira é enviada ao manga-ocr e volta como uma única região, sem coordenadas. O manga-ocr foi pensado para recortes de balão.
- Adicionar uma etapa de detecção de regiões de texto antes do OCR. Isso também é pré-requisito para exibir a tradução alinhada ao balão.

### 5. Captura de imagens grandes
- O canvas exporta PNG; tiras longas de manhwa podem passar do limite de 12 MB do backend. Exportar em JPEG ou reduzir a imagem antes do envio.

### 6. Interface React/Vite (`extension/`)
- Contém apenas serviços (`backend.ts`, `ocr.ts`, `settings.ts`) e configuração. Faltam `index.html`, ponto de entrada, `background.js` e ícones citados no manifest, então o build não deve funcionar.
- Decidir entre concluir e consolidar com a extensão da raiz, ou remover a pasta.

### 7. Detalhes
- Versões divergentes: extensão da raiz 0.6.0, API do backend 0.4.0 (`main.py` e `/health`), `extension/` 0.3.0.
- `MutationObserver` do content script varre todas as imagens a cada mudança do DOM; aplicar debounce.
- Testes cobrem validação e o provedor simulado; faltam testes do caminho feliz de `decode_image` e `run_ocr` com adaptador simulado.

## Próximas etapas (a priorizar)
- Detecção e segmentação de balões, com coordenadas por região.
- Exibição da tradução sobre o balão, em vez de um painel abaixo da imagem.
- Remoção do texto original e lettering.
- Leitor CBR/CBZ.
- Consolidação das duas interfaces da extensão em um único pacote.
