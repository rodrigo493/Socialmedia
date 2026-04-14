# Step · Inteligência Competitiva

**Owner agent:** iris-influencer (com apoio de bruno-balizador para revisão)

**Input:**
- `_investigations/consolidated-analysis.md`
- `_investigations/<handle>/pattern-analysis.md` e `raw-content.md` para cada perfil
- `pipeline/data/report.schema.json`

**Output obrigatório:**
- `output/<YYYY-MM-DD>.report.json` — seguindo EXATAMENTE o schema em `pipeline/data/report.schema.json`. Qualquer desvio quebra a renderização no painel.

## Como montar

1. Ler todos os `pattern-analysis.md` de cada concorrente em `_investigations/`.
2. Selecionar os 3–5 vídeos com maior view count agregada (campo `views` da investigação). Preencher `topVideos[]` com o motivo estratégico do sucesso em `whyItWorked` (mínimo 120 chars, análise, não descrição).
3. Destilar 2–5 **Winning Patterns** — padrões transversais observados em múltiplos perfis (ex: "Transformação de Identidade Radical"). Cada um com corpo mínimo 200 chars e terminando com como aplicar para Live Universe.
4. Gerar no mínimo 5 **Hook Ideas** — frases curtas, quote style, prontas para virar primeiro frame de vídeo. Cada um acompanhado de análise (por que funciona + como Live deve adaptar).
5. Para pelo menos 3 dos hooks, produzir **roteiros completos** (`scripts[]`) em formato [CENA N] com VISUAL / ÁUDIO / TEXTO NA TELA. Duração `"60 segundos"` padrão.
6. Fechar com **Key Takeaway** — síntese estratégica (300+ chars) + 3–5 ações imediatas com título e descrição.

## Regras
- Zero invenção. Todo `whyItWorked` e cada pattern precisa de evidência nas investigações (citação de views, handle, mecânica observada).
- `sources[]` do meta deve listar todos os @handles usados.
- `date` sempre no formato `YYYY-MM-DD` (ISO).
- Salvar como `output/<ISO_DATE>.report.json`. Se já existir do mesmo dia, sobrescrever.

## Validação
bruno-balizador valida antes do arquivo ser commitado:
- JSON parse limpo
- Todos os campos obrigatórios do schema preenchidos
- Nenhum texto de placeholder tipo "TODO" ou "[inserir]"
- Mínimos de tamanho respeitados

## Quem consome
- `GET /api/v1/reports/latest` (backend Fastify em `apps/api/`)
- Renderizado em `/relatorio` no painel
