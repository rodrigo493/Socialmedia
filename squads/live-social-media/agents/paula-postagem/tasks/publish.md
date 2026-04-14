---
id: "squads/live-social-media/agents/paula-postagem/tasks/publish"
name: "Publicar Conteúdo Aprovado"
agent: "paula-postagem"
---

# Task: Publicar Conteúdo Aprovado

## Objetivo
Publicar no Instagram e TikTok apenas as peças de conteúdo que passaram pela revisão do Bruno Balizador e foram aprovadas pelo usuário no checkpoint obrigatório, documentando cada publicação no log.

## AVISO CRÍTICO
Esta task só pode ser executada APÓS a confirmação explícita do checkpoint de aprovação humana. Se o checkpoint não estiver registrado no contexto da execução do squad, PARE imediatamente e emita o alerta:

```
IMPEDIMENTO IDENTIFICADO: Checkpoint de aprovação humana não confirmado.
Paula Postagem não pode prosseguir sem aprovação explícita do usuário.
Aguardando instrução.
```

## Inputs Necessários
- `squads/live-social-media/output/review-report.md` — veredictos do Bruno Balizador
- Arquivos de conteúdo com veredicto APROVADO em `squads/live-social-media/output/`
- Confirmação do checkpoint de aprovação humana (obrigatório)

## Processo de Publicação

### Passo 1 — Verificar checkpoint
Confirmar que o checkpoint de aprovação humana está registrado na execução atual do squad. Se não estiver: PARAR e emitir alerta (ver AVISO CRÍTICO acima).

### Passo 2 — Extrair lista de aprovados
Abrir `review-report.md` e listar apenas as peças com veredicto **APROVADO**. Ignorar completamente peças REPROVADAS.

Formato da lista:
```
LISTA DE APROVADOS:
1. [nome do arquivo] — [tipo] — [plataforma(s)]
2. [nome do arquivo] — [tipo] — [plataforma(s)]
...
```

### Passo 3 — Mapear plataforma por formato
Aplicar as regras de distribuição:
- **Reels** → Instagram Reels + TikTok
- **Carrossel** → Instagram Feed (somente)
- **Stories** → Instagram Stories (somente)
- **TikTok** → TikTok (somente)
- **Conteúdo de Influenciador** → conforme instrução no arquivo de conteúdo

### Passo 4 — Definir ordem de publicação
Ordenar as publicações por estágio de funil:
1. Topo de funil (awareness) — publicar primeiro
2. Meio de funil (consideração) — publicar segundo
3. Fundo de funil (decisão/conversão) — publicar por último

Respeitar espaçamento mínimo de 2 horas entre posts no mesmo perfil, quando aplicável ao agendamento.

### Passo 5 — Publicar via Blotato
Para cada peça na ordem definida:

1. Carregar o arquivo de conteúdo para identificar: caption, hashtags, mídia associada, horário de publicação (se houver agendamento)
2. Usar Blotato para fazer upload da mídia e publicar/agendar
3. Registrar o resultado imediatamente no log (ver Passo 6)
4. Se Blotato retornar erro: PARAR, documentar o erro no log e emitir alerta antes de continuar

Formato de alerta de erro Blotato:
```
IMPEDIMENTO IDENTIFICADO: Erro ao publicar [nome do arquivo] em [plataforma].
Erro retornado: [descrição do erro]
Aguardando instrução para prosseguir.
```

### Passo 6 — Registrar no publish-log.md
Para cada publicação bem-sucedida, adicionar linha no log:

```
| [timestamp] | [plataforma] | [tipo de conteúdo] | [URL do post] | [status] |
```

Exemplo:
```
| 2025-04-14 09:00 BRT | Instagram Reels | Reels | https://instagram.com/p/XXX | PUBLICADO |
| 2025-04-14 11:00 BRT | TikTok | Reels | https://tiktok.com/@liveuniverse/video/XXX | PUBLICADO |
```

### Passo 7 — Emitir relatório de conclusão
Ao finalizar todas as publicações, emitir mensagem:

```
PUBLICAÇÃO CONCLUÍDA
- Total de peças publicadas: N
- Instagram: N posts
- TikTok: N posts
- Erros encontrados: N (se houver, listar)
- Log completo: squads/live-social-media/output/publish-log.md
```

## Critérios de Conclusão
- [ ] Checkpoint de aprovação humana verificado antes de qualquer publicação
- [ ] Apenas peças APROVADAS pelo Bruno Balizador foram publicadas
- [ ] Cada publicação registrada no log com URL verificável e timestamp
- [ ] Erros de Blotato documentados e reportados antes de continuar
- [ ] Relatório de conclusão emitido ao final

## Output
Arquivo: `squads/live-social-media/output/publish-log.md`
