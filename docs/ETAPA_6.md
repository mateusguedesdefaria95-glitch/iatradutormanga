# Etapa 6 — Fila de tradução em lote

## Implementado
- Ação **Traduzir tudo** no popup para iniciar o processamento das imagens elegíveis da página.
- Fila sequencial: cada imagem passa por captura, OCR e tradução antes da próxima.
- Indicador de progresso e contadores de concluídas e falhas.
- Cancelamento solicitado pelo popup e respeitado entre imagens.
- Falhas individuais não interrompem o restante da fila.
- Estado do lote compartilhado com o popup por `chrome.storage.local`.

## Como usar
1. Inicie o backend e configure o provedor de tradução.
2. Abra a página do mangá e aguarde as imagens carregarem.
3. Abra o popup e clique em **Traduzir tudo**.
4. Acompanhe o progresso; use **Cancelar** para interromper após a imagem em andamento.
5. Use **Restaurar** para remover os painéis exibidos.

## Limitações
- O lote só processa elementos `img` com dimensões naturais acima de 140 × 140 pixels e que possam ser capturados pelo canvas.
- Imagens cross-origin sem CORS, imagens em canvas/iframe e leitores com renderização própria podem não ser detectados ou capturados.
- O cancelamento não interrompe uma chamada OCR/tradução já iniciada; é aplicado antes da próxima imagem.
- A tradução permanece em painel abaixo da imagem, sem apagar ou substituir o texto original.
- A fila é mantida no content script da aba; fechar ou recarregar a página encerra o processamento.
