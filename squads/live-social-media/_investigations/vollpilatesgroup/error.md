# Erro de Investigação: @vollpilatesgroup (Instagram)

**Data:** 2026-04-14
**Investigador:** Sherlock (Opensquad)
**Perfil:** https://www.instagram.com/vollpilatesgroup/

---

## Problema Encontrado

A investigação não pôde ser concluída porque o **browser Playwright não está autenticado no Instagram**.

### Sintomas Observados

1. Ao navegar para `https://www.instagram.com/vollpilatesgroup/`, o Instagram redirecionou para perfis patrocinados/recomendados (technogym_brazil, equipilates_oficial) em vez de mostrar o perfil solicitado.
2. Ao navegar para `https://www.instagram.com/` e verificar o estado da página, foi exibida a tela de **login do Instagram** — confirmando que não há sessão ativa.
3. O perfil de browser persistente existe em `_opensquad/_browser_profile/`, mas não contém cookies válidos de sessão do Instagram.

### Ferramentas Alternativas Testadas

- **Apify MCP** (`apify/instagram-scraper`): Permissão negada para uso do `apify_discover` e ferramentas relacionadas.
- **browser_press_key (Escape)**: Permissão negada.
- **browser_evaluate (JavaScript)**: Permissão negada.

---

## Ação Necessária pelo Usuário

Para que a investigação possa ser concluída, o usuário precisa realizar **uma das seguintes ações**:

### Opção 1 (Recomendada): Login Manual no Instagram
1. Abra o Claude Code em modo com browser visível (não headless)
2. Execute: `/opensquad run live-social-media` (ou outro comando que abra o browser)
3. Quando o browser abrir, navegue para `https://www.instagram.com/accounts/login/`
4. Faça login com suas credenciais do Instagram
5. O perfil de browser persistente salvará a sessão automaticamente
6. Execute novamente a investigação

### Opção 2: Habilitar Permissão do Apify
- Conceda permissão para as ferramentas `mcp__apify-mcp__*` nas configurações do Claude Code
- O Instagram Scraper do Apify pode extrair posts sem necessidade de login

### Opção 3: Mudar para Modo Headless=False
- Edite `_opensquad/config/playwright.config.json`
- Altere `"headless": true` para `"headless": false`
- Isso permite visualizar e interagir com o browser durante o login

---

## Configuração Atual do Playwright

```json
{
  "browser": {
    "browserName": "chromium",
    "isolated": false,
    "userDataDir": "_opensquad/_browser_profile",
    "launchOptions": {
      "headless": true,
      "channel": "chrome"
    }
  }
}
```

**Arquivo:** `_opensquad/config/playwright.config.json`
