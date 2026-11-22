# Etapa 4 — Tradução contextual por provedor compatível

## Implementado nesta etapa
- Novo endpoint `POST /translate`.
- Tradução de uma lista ordenada de trechos, preservando correspondência de cada balão.
- Idioma de origem configurável (ou `auto`), idioma de destino e contexto opcional da obra.
- Integração com API compatível com OpenAI Chat Completions.
- Chave, URL e modelo configurados exclusivamente no ambiente do backend.
- Limites de entrada, timeout, tratamento de falhas HTTP e validação da resposta JSON.
- Testes com cliente HTTP simulado; não exigem chamada paga a um serviço externo.

## Configuração

Defina as variáveis no ambiente em que o backend será iniciado:

```bash
MANGA_TRANSLATION_API_KEY=sua_chave
MANGA_TRANSLATION_API_URL=https://api.openai.com/v1/chat/completions
MANGA_TRANSLATION_MODEL=gpt-4o-mini
```

A URL padrão é a API OpenAI. Outros provedores podem ser usados se aceitarem o formato Chat Completions e JSON mode. Para evitar expor segredos, não envie a chave pela extensão, não a coloque no repositório e não a inclua em capturas de tela.

## Exemplo de requisição

```json
{
  "texts": ["こんにちは", "待って！"],
  "source_language": "ja",
  "target_language": "pt-BR",
  "context": "Dois colegas conversando informalmente."
}
```

A resposta contém `result.translations` na mesma ordem da entrada. A extensão atual ainda precisa de uma interface para acionar este endpoint e apresentar a tradução junto da imagem.

## Limitações
- A qualidade e o custo dependem do provedor e do modelo configurados.
- Esta etapa traduz texto já extraído; não realiza OCR automaticamente dentro do endpoint de tradução.
- Não remove o texto original nem redesenha os balões.
- Não é uma tradução juramentada nem substitui revisão humana.
