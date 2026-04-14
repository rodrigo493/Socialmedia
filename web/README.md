# Live Universe · Control Room

Painel web para aprovar materiais do squad `live-social-media` e publicar em redes sociais.

## Estética
"Broadcast Editorial" — sala de controle de transmissão + revista de tipografia.
- **Display:** Fraunces (serifa italic characterful)
- **Texto:** Instrument Sans
- **Meta / técnico:** JetBrains Mono
- **Cores:** ink (#0B0B0C) · paper (#F4EFE7) · on-air (#E5322B) · amber · signal green
- **Texturas:** grão fílmico, scanlines sutis, brackets de enquadramento, marquee de status

## Stack
- React 18 + Vite + React Router
- Tailwind 3
- Motion (reservado para animações avançadas)

## Como rodar
```bash
cd web
npm install
npm run dev
```
Abre em http://localhost:5173. Proxy `/api` → `http://localhost:3000` (backend futuro).

## Estrutura
```
src/
├── App.jsx, main.jsx, index.css
├── data/mock.js              ← materiais de exemplo (substituir por API)
├── components/
│   ├── Layout.jsx            ← top bar, marquee, footer
│   ├── MaterialCard.jsx      ← card do inbox
│   ├── NetworkSelector.jsx   ← chips de redes
│   └── Previews.jsx          ← IG feed/story, TikTok, LinkedIn
└── pages/
    ├── Inbox.jsx             ← grid de materiais
    ├── Detail.jsx            ← preview + aprovação + botão Postar
    ├── History.jsx           ← arquivo do que já foi no ar
    └── Agents.jsx            ← elenco do squad
```

## Próximos passos
1. Backend Fastify + SQLite em `apps/approval-panel/api/`
2. Substituir `mock.js` por fetch de `GET /api/v1/items`
3. `POST /api/v1/items/:id/publish` no clique do botão Postar
4. Publishers Playwright por rede reusando `_opensquad/_browser_profile/`
