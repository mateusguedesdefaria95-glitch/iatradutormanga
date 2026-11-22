# MangaTradutor AI

Extensão para Chrome e Microsoft Edge com backend local para leitura assistida, OCR e tradução de páginas de mangá.

## Estado atual — backend v0.4.0

### Extensão
- Manifest V3 para Chrome e Edge.
- Popup e página de configurações.
- Preferências de idioma, qualidade e processamento.
- Detecção heurística de imagens candidatas a páginas de mangá.
- Seleção e destaque da imagem na página.
- Captura da imagem selecionada via canvas e envio ao backend local para OCR.
- Exibição do texto reconhecido no popup.

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
- Node.js 20+ e npm 10+.
- Python 3.11+.
- Chrome ou Microsoft Edge.

## Instalar e compilar a extensão

```bash
cd extension
npm install
npm run build
```

Carregue `extension/dist` em `chrome://extensions` ou `edge://extensions` com o modo de desenvolvedor ativado.

## Iniciar o backend

Na raiz do projeto:

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

A URL e o modelo podem ser ajustados para um provedor compatível com o formato Chat Completions. A chave não deve ser enviada pela extensão nem salva no GitHub. Sem chave, OCR continua disponível, mas `POST /translate` responde com HTTP 503 e uma mensagem de configuração.

Exemplo de requisição:

```json
{
  "texts": ["こんにちは", "待って！"],
  "source_language": "ja",
  "target_language": "pt-BR",
  "context": "Dois colegas conversando informalmente."
}
```

### Instalar um mecanismo OCR

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
- `docs/ETAPA_2.md` — interface e detecção inicial.
- `docs/ETAPA_3.md` — OCR e pipeline de imagem.
- `docs/ETAPA_4.md` — endpoint de tradução e configuração do provedor.

## Limitações atuais
- A detecção de páginas ainda usa heurísticas de dimensões e proporção; não é um classificador treinado.
- Captura via canvas pode falhar em imagens de outros domínios sem CORS.
- O OCR japonês atual extrai texto da página sem caixas individuais por balão.
- OCR coreano/chinês/inglês fornece regiões e polígonos via EasyOCR.
- O endpoint de tradução recebe texto já extraído; a interface da extensão ainda precisa ser conectada ao fluxo de tradução.
- Remoção de texto, inpainting, lettering e leitor CBR/CBZ ainda não foram implementados.

## Privacidade e segurança
- Por padrão, o backend escuta somente em `127.0.0.1`.
- Nesta versão, a imagem é enviada somente ao backend local configurado pela pessoa usuária.
- Não coloque chaves de API no código, no repositório ou em arquivos versionados.
- Não exponha o backend publicamente sem autenticação, proteção contra abuso e configuração CORS apropriada.
