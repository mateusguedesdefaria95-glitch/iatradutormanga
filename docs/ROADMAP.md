# Roadmap — MangaTradutor AI

Visão geral do desenvolvimento. Cada etapa concluída tem um documento próprio em `docs/ETAPA_N.md`.

## Etapas concluídas

| Etapa | Entrega | Documento |
|---|---|---|
| 3 | OCR inicial (manga-ocr e EasyOCR) e pipeline de imagem | `ETAPA_3.md` |
| 4 | Endpoint `POST /translate` com provedor compatível com OpenAI | `ETAPA_4.md` |
| 5 | Integração da extensão com OCR e tradução | `ETAPA_5.md` |
| 6 | Fila de tradução em lote com progresso e cancelamento | `ETAPA_6.md` |
| 7 | CORS fechado, chamadas pelo service worker, popup enxuto, página de envio refeita | `ETAPA_7.md` |

## Pendências conhecidas

Ordenadas por prioridade sugerida.

### 1. Executar o que foi escrito
- Rodar `python -m pytest -q` em um ambiente com `fastapi`, `httpx` e `pytest-asyncio` instalados. Os testes da etapa 7 foram escritos sem poder ser executados.
- Testar a extensão no Chrome/Edge: lote, tradução automática por site, página de envio e o teste de conexão nas configurações.
- Confirmar que o service worker permanece ativo durante um OCR demorado (primeiro carregamento do manga-ocr).

### 2. Qualidade do OCR japonês
- A página inteira é enviada ao manga-ocr e volta como uma única região, sem coordenadas. O manga-ocr foi pensado para recortes de balão.
- Adicionar uma etapa de detecção de regiões de texto antes do OCR. Isso também é pré-requisito para exibir a tradução alinhada ao balão.

### 3. Backend em outra máquina ou URL
- Hoje a proteção é o CORS fechado. Se o backend for exposto fora de `127.0.0.1`, adicionar autenticação por token e limite de uso.

### 4. Interface React/Vite (`extension/`)
- Contém apenas serviços (`backend.ts`, `ocr.ts`, `settings.ts`) e configuração. Faltam `index.html`, ponto de entrada, `background.js` e ícones citados no manifest, então o build não deve funcionar. A versão do pacote é 0.3.0.
- Decidir entre concluir e consolidar com a extensão da raiz, ou remover a pasta.

### 5. Testes
- Faltam testes do caminho feliz de `decode_image` e de `run_ocr` com adaptador simulado.
- Não há testes automatizados para os scripts da extensão.

## Próximas etapas (a priorizar)
- Detecção e segmentação de balões, com coordenadas por região.
- Exibição da tradução sobre o balão, em vez de um painel abaixo da imagem.
- Remoção do texto original e lettering.
- Leitor CBR/CBZ.
- Consolidação das duas interfaces da extensão em um único pacote.
