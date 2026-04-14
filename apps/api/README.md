# Live Universe · API

Backend Fastify que serve o painel `/relatorio` e afins com dados reais lidos do filesystem do squad.

## Como rodar

```bash
cd apps/api
npm install
# seed opcional: gera um report.json real a partir do mock atual
node scripts/seed-report.js
npm run dev
```

API sobe em `http://localhost:3000`. O frontend (em `web/`) já está proxy-configurado — basta rodar `npm run dev` lá também.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/v1/health` | Liveness |
| GET | `/api/v1/reports` | Lista todos os `*.report.json` em `squads/live-social-media/output/` |
| GET | `/api/v1/reports/latest` | Retorna o mais recente |
| GET | `/api/v1/reports/:file` | Retorna um específico |
| GET | `/api/v1/investigations` | Lista perfis investigados em `_investigations/` |
| POST | `/api/v1/reports/generate` | Stub — retorna instrução para rodar `/opensquad run` no Claude Code |
| GET | `/media/*` | Serve mídia crua de `output/` (imagens/vídeos) |

## Como o relatório é produzido

1. O usuário roda `/opensquad run live-social-media --step=inteligencia-competitiva` no Claude Code.
2. O agente `iris-influencer` lê `_investigations/consolidated-analysis.md` + pastas por perfil.
3. Grava `squads/live-social-media/output/<YYYY-MM-DD>.report.json` seguindo `pipeline/data/report.schema.json`.
4. `bruno-balizador` valida.
5. O painel em `/relatorio` mostra o mais recente automaticamente.

Até essa integração existir, `scripts/seed-report.js` produz o arquivo a partir dos dados atuais do frontend — útil para testar o pipeline backend→frontend hoje.
