# MangaTradutor AI

Extensão para Chrome e Microsoft Edge com backend local para detecção de imagens, OCR e tradução de páginas de mangá.

## Estado do projeto — v0.5.0 (integração inicial)

### Extensão
- Manifest V3 para Chrome e Edge.
- Popup com preferências de idioma, escopo e ações.
- Página de configurações para URL do backend, idioma original e contexto da obra.
- Verificação de conexão com o backend local.
- Detecção heurística de imagens candidatas em páginas web.
- Botão **Traduzir** sobre cada imagem detectada.
- Fluxo integrado: captura da imagem → OCR → tradução dos trechos.
- Exibição da tradução em um painel abaixo da imagem.
- Remoção dos painéis de tradução pela ação Restaurar.

### Backend
- API FastAPI local.
- Endpoint de saúde `GET /health`.
- Endpoint OCR `POST /ocr` com validação de imagem.
- Adaptador japonês opcional `manga-ocr`.
- Adaptador multilíngue opcional EasyOCR para coreano, chinês simplificado e inglês.
- Endpoint `POST /translate` para traduzir uma lista ordenada de trechos.
- Integração configurável com provedores compatíveis com OpenAI Chat Completions.
- Chaves de API mantidas no ambiente do backend, nunca na extensão.

## Requisitos
- Node.js 20+ e npm 10+ (para a extensão React em `extension/`).
- Python 3.11+.
- Chrome ou Microsoft Edge.

## Carregar a extensão simples (raiz do repositório)
1. Abra `chrome://extensions` ou `edge://extensions`.
2. Ative o modo do desenvolvedor.
3. Clique em **Carregar sem compactação** e selecione a pasta raiz do repositório.
4. Abra as configurações da extensão e informe `http://127.0.0.1:8765`.
5. Selecione o idioma original e salve.
6. Inicie o backend e configure o provedor de tradução (instruções abaixo).
7. Em uma página com imagens de mangá, clique no botão **Traduzir** sobre a imagem.

> A extensão simples da raiz é a interface conectada ao fluxo OCR + tradução. A pasta `extension/` contém a implementação React/Vite em desenvolvimento; as duas interfaces ainda não foram consolidadas em um único pacote.

## Iniciar o backend

Na raiz:

```bash
python -m venv .venv
```

Windows PowerShell: `.venv\\Scripts\\Activate.ps1`

macOS/Linux: `source .venv/bin/activate`

```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 127.0.0.1 --port 8765 --reload
```

### Configurar tradução

Configure as variáveis no ambiente antes de iniciar o backend:

```bash
MANGA_TRANSLATION_API_KEY=sua_chave
MANGA_TRANSLATION_API_URL=https://api.openai.com/v1/chat/completions
MANGA_TRANSLATION_MODEL=gpt-4o-mini
```

A URL e o modelo podem ser ajustados para um provedor compatível com o formato Chat Completions. A chave não deve ser enviada pela extensão nem salva no GitHub. Sem chave, OCR continua disponível, mas `POST /translate` responde HTTP 503.

### Instalar OCR

Japonês:

```bash
pip install -r backend/requirements-ocr-ja.txt
```

Coreano, chinês simplificado e inglês:

```bash
pip install -r backend/requirements-ocr-multilingual.txt
```

O primeiro uso pode baixar modelos e demorar. Instale somente o mecanismo que pretende usar.

## Testes

Na raiz:

```bash
python -m pytest -q
```

Na pasta `extension`: `npm run typecheck` e `npm run build`.

## Documentação
- `docs/ROADMAP.md` — visão geral do desenvolvimento.
- `docs/ETAPA_3.md` — OCR e pipeline de imagem.
- `docs/ETAPA_4.md` — endpoint de tradução.
- `docs/ETAPA_5.md` — integração inicial entre extensão, OCR e tradução.

## Limitações conhecidas
- A detecção de páginas usa heurísticas; não é um classificador treinado.
- Captura via canvas pode falhar em imagens de outros domínios sem CORS.
- OCR japonês retorna o texto da página como uma única região; OCR multilíngue pode retornar várias regiões.
- A tradução é exibida abaixo da imagem, não dentro dos balões.
- Ainda não há remoção do texto original, inpainting, lettering, tradução automática em lote nem leitor CBR/CBZ.
- A extensão React/Vite ainda não foi consolidada com a interface simples da raiz.

## Privacidade e segurança
- Por padrão, o backend escuta somente em `127.0.0.1`.
- Imagens são enviadas ao backend configurado pela pessoa usuária.
- Não coloque chaves de API no código, na extensão, no repositório ou em arquivos versionados.
- Não exponha o backend publicamente sem autenticação, proteção contra abuso e CORS apropriado.
