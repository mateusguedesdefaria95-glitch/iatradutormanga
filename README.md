# MangaTradutor AI

Extensão para Chrome e Microsoft Edge com backend local para leitura assistida e OCR de páginas de mangá.

## Estado atual — v0.3.0

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
- Endpoint `GET /health`.
- Endpoint `POST /ocr` com validação de imagem.
- Adaptador japonês opcional `manga-ocr`.
- Adaptador multilíngue opcional EasyOCR para coreano, chinês simplificado e inglês.

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

### Instalar OCR opcional

Japonês: `pip install -r backend/requirements-ocr-ja.txt`

Coreano, chinês simplificado e inglês: `pip install -r backend/requirements-ocr-multilingual.txt`

O primeiro uso pode baixar modelos e demorar. Instale somente o mecanismo que pretende usar.

## Testes

```bash
python -m pytest -q
```

Na pasta `extension`: `npm run typecheck` e `npm run build`.

## Documentação
- `docs/ROADMAP.md`
- `docs/ETAPA_2.md`
- `docs/ETAPA_3.md`

## Limitações atuais
- A detecção ainda usa heurísticas, não um classificador treinado.
- Captura via canvas pode falhar em imagens de outros domínios sem CORS.
- O OCR japonês extrai texto da página sem caixas individuais por balão.
- OCR coreano/chinês/inglês fornece regiões e polígonos via EasyOCR.
- Tradução contextual, detecção avançada de balões, remoção de texto, inpainting, lettering, leitor CBR/CBZ e processamento em lote ainda não foram implementados.

## Privacidade
- O backend escuta por padrão somente em `127.0.0.1`.
- A imagem é enviada ao backend local configurado pela pessoa usuária.
- Não versionar chaves de API ou segredos.
- Não exponha o backend publicamente sem autenticação, proteção contra abuso e CORS apropriado.

---

## Extensão alternativa com popup inspirado em tradutores imersivos

Também há uma versão independente e simples, carregável diretamente pelo Chrome/Edge, na raiz do repositório. Ela inclui popup com idioma/modelo/escopo, botão flutuante em imagens, página de upload, opções e restauração da imagem original.

### Testar a versão de popup
1. Baixe ou clone o repositório.
2. Abra `chrome://extensions` ou `edge://extensions`.
3. Ative o modo do desenvolvedor.
4. Clique em **Carregar sem compactação** e selecione a pasta raiz do repositório.
5. Abra as configurações da extensão e informe a URL de um backend compatível com o contrato abaixo.

O endpoint de tradução deve receber `POST` JSON com `image`, `targetLanguage` e `model`, e retornar `{ "translatedImage": "data:image/png;base64,..." }`. Esta interface é um protótipo funcional de extensão; a tradução efetiva depende da implementação e configuração do backend de OCR/tradução/inpainting. Tradução em lote e pré-tradução ainda estão no roadmap.
