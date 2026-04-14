# Catálogo de Produtos · Live Equipamentos

Fotos e metadata dos equipamentos usados pelas influencers IA da Live.

## Como adicionar um produto

1. Criar pasta: `_products/<slug>/` (ex: `_products/reformer-v12/`)
2. Jogar as fotos dentro (PNG/JPG, 1500px+ no lado maior):
   - `frontal.png` — equipamento frontal, fundo limpo
   - `perspectiva.png` — 3/4, ângulo cinematográfico
   - `close.png` — detalhe (logo, molas, carpete)
   - `ambiente.png` — em studio/academia montado
   - `uso.png` — pessoa usando (se tiver)
3. Criar `catalog.json` na pasta do produto usando o template abaixo
4. Os arquivos podem ser subidos via `POST /api/v1/uploads` ou arrastados direto no painel (aba em breve)

## Template catalog.json

```json
{
  "slug": "reformer-v12",
  "name": "Reformer V12",
  "category": "Pilates Studio",
  "icp": "Instrutora de Pilates · donos de studio premium",
  "differential": "48 molas, estrutura de aço galvanizado, carpete premium",
  "description": "Reformer profissional de alta gama da linha Live Studio.",
  "images": {
    "frontal": "frontal.png",
    "perspectiva": "perspectiva.png",
    "close": "close.png",
    "ambiente": "ambiente.png",
    "uso": "uso.png"
  },
  "tags": ["pilates", "studio", "reformer", "premium"]
}
```

## Uso no pipeline

Agentes Iris, Caio, Davi lêem esse catálogo via `GET /api/v1/products` e injetam detalhes do produto no prompt do Nano Banana / Kling / Veo quando o usuário pede "vídeo com a Ana Lua usando o V12".
