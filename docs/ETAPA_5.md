# Etapa 5 — Integração inicial da extensão com OCR e tradução

## Implementado
- A extensão da raiz do repositório agora usa o backend local configurado nas opções.
- A captura da imagem selecionada é enviada ao endpoint `POST /ocr`.
- Os textos reconhecidos são enviados ao endpoint `POST /translate`.
- Idioma original e idioma de destino são configuráveis.
- É possível informar contexto opcional para ajudar na consistência da tradução.
- A extensão mostra as traduções em um painel abaixo da imagem.
- A ação Restaurar remove os painéis e permite processar novamente as imagens.
- As opções incluem teste de conexão com `GET /health`.
- A chave do provedor permanece no ambiente do backend; a extensão não recebe nem armazena essa credencial.

## Como usar
1. Inicie o backend em `http://127.0.0.1:8765`.
2. Instale o mecanismo OCR correspondente ao idioma.
3. Configure as variáveis do provedor de tradução no ambiente do backend.
4. Carregue a pasta raiz do projeto em Chrome ou Edge.
5. Abra Configurações e informe a URL do backend e o idioma original.
6. Acesse uma página com imagens de mangá e clique em **Traduzir** sobre uma imagem.

## Limitações
- O navegador não consegue capturar imagens cross-origin sem permissões CORS adequadas.
- A tradução aparece em um painel abaixo da imagem; o texto original permanece na arte.
- OCR japonês retorna uma região com o texto da imagem inteira; a posição por balão ainda não é detectada.
- A ação do popup para traduzir a página apenas identifica imagens; nesta etapa, a tradução é acionada individualmente pelo botão sobre cada imagem.
- A interface React/Vite em `extension/` ainda não foi conectada a este fluxo simples da raiz.
- Não foi implementado processamento de arquivos CBR/CBZ.

## Próxima etapa
- Processamento em lote com fila, progresso, cancelamento e tratamento individual de falhas.
- Melhorias de detecção e segmentação de balões.
- Exibição alinhada das traduções por região quando o OCR fornecer coordenadas.
