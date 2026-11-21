# Etapa 3 — OCR inicial e pipeline de imagem

## Implementado
- Endpoint POST /ocr para receber imagem em data URL base64.
- Validação de tipo, tamanho (12 MB) e dimensões da imagem.
- Adaptador OCR japonês com manga-ocr (extra opcional).
- Adaptador multilíngue com EasyOCR para coreano, chinês simplificado e inglês (extra opcional).
- Retorno estruturado com texto, engine, idioma, dimensões, polígonos e confiança quando disponível.
- Testes para saúde da API e validação de requisição.

## Instalação do OCR
OCR japonês:
pip install -r backend/requirements-ocr-ja.txt

OCR coreano/chinês/inglês:
pip install -r backend/requirements-ocr-multilingual.txt

Inicie o backend:
uvicorn backend.app.main:app --host 127.0.0.1 --port 8765 --reload

## Limitações conhecidas
- Captura por canvas depende de a imagem permitir leitura pelo navegador; imagens cross-origin sem CORS podem ser bloqueadas.
- O primeiro carregamento dos modelos OCR pode demorar e baixar pesos grandes.
- OCR japonês ainda não segmenta precisamente cada balão.
- Ainda não existe tradução automática, detecção semântica de balões, remoção de texto nem lettering.
