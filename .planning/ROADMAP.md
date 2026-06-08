# Roadmap: Arquiteto de Agentes LiderHub

## Overview

O plugin parte de uma fundacao tecnica solida (estrutura do agente + especificacao de formato LiderHub + gerador de prompts validado), prova valor imediato no modo MELHORAR usando o funil de auxilio-acidente real (8 agentes + conversas existentes), e entrega o modo CRIAR para construir teses novas de ponta a ponta. Cada fase e uma fatia vertical utilizavel: a fundacao instala e valida o gerador; MELHORAR entrega diagnostico + prompts revisados prontos para colar; CRIAR entrega cadeia nova + checklist de setup.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Fundacao e Gerador** - Plugin instalavel com spec LiderHub canonico e gerador de prompts validado
- [x] **Phase 2: Pipeline MELHORAR** - Fatia vertical completa: ingere conversas reais, diagnostica funil, entrega prompts revisados prontos para colar
- [x] **Phase 3: Pipeline CRIAR e Orquestrador** - Fatia vertical completa: recebe tese, compoe conhecimento juridico, gera cadeia de agentes + checklist de setup

## Phase Details

### Phase 1: Fundacao e Gerador
**Goal**: O operador tem um plugin instalavel com a constituicao de sintaxe LiderHub como referencia canonica e um gerador de prompts que emite tokens exatos, preserva UUIDs e usa placeholders — validado contra os 8 agentes reais do aux-acidente antes de qualquer pipeline ser fiado.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PLUGIN-02, PLUGIN-03, OUT-01, OUT-02, OUT-03, OUT-04, OUT-05
**Success Criteria** (what must be TRUE):
  1. O plugin esta instalado em `C:\Users\dudsl\plugins-juridico\arquiteto-liderhub\` com manifest valido e reconhecido pelo Claude Code
  2. `references/liderhub-format-spec.md` existe e cobre os 8 tipos de token, sintaxe de @mencoes, regra de sobreposicao de prompt e os 3 anti-padroes LiderHub
  3. `references/token-registry.json` existe com scaffold de UUIDs do workspace aux-acidente para o operador popular
  4. A skill `generate-liderhub-prompts` produz um prompt de agente aux-acidente de referencia com tokens JSON em linha unica, @mencoes corretas e bloco de sobreposicao — sem nenhum UUID fabricado
  5. Um scan automatico de UUID rejeita qualquer output que contenha UUIDs inventados no modo CRIAR e confirma preservacao verbatim no modo MELHORAR
**Plans**: TBD

### Phase 2: Pipeline MELHORAR
**Goal**: O operador pode rodar `/MELHORAR` com conversas reais de leads (formato Valmir.txt), receber um relatorio de diagnostico de drop-off por agente com PII mascarada, e obter os prompts revisados dos agentes problemáticos prontos para colar na LiderHub — validado no funil de auxilio-acidente (8 agentes + conversas reais).
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: MEL-01, MEL-02, MEL-03, MEL-04, MEL-05, MEL-06, PROVA-01
**Success Criteria** (what must be TRUE):
  1. O operador coloca arquivos .txt no formato WhatsApp em `data/conversas/` e roda `/MELHORAR`; o plugin parseia os turnos e atribui cada segmento a um agente do funil sem instrucao adicional
  2. CPF, nomes e dados de saude sao substituidos por `[CPF_REDACTED]`, `[LEAD_A]` e `[SAUDE_REDACTED]` antes de qualquer analise aparecer no output
  3. O relatorio de diagnostico indica por agente qual a taxa de drop, qual pergunta/padrao causa o abandono, e classifica cada saida como desqualificacao correta ou provavel erro de prompt
  4. Os prompts revisados dos agentes identificados como problematicos sao entregues com delimitadores `=== INICIO DO PROMPT ===` / `=== FIM DO PROMPT ===` e tokens com os UUIDs originais preservados verbatim
  5. O campo de prova passa: rodar MELHORAR no funil de auxilio-acidente existente produz output colavel que o operador consegue colar diretamente em pelo menos 1 agente da LiderHub sem ajuste de formato
**Plans**: TBD

### Phase 3: Pipeline CRIAR e Orquestrador
**Goal**: O operador pode rodar `/CRIAR` para uma tese juridica e receber uma cadeia completa de agentes LiderHub na sintaxe exata com placeholders marcados + uma checklist de setup ordenada do que criar no workspace — com o agente `arquiteto` orquestrando ambos os modos e o campo de prova concluido criando 1 tese trabalhista nova de ponta a ponta.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: PLUGIN-01, CRI-01, CRI-02, CRI-03, PROVA-02
**Success Criteria** (what must be TRUE):
  1. O operador invoca `/CRIAR --tese "auxilio-acidente-trabalhista"` (ou tese equivalente) e o agente `arquiteto` roteia corretamente para o pipeline CRIAR sem intervencao manual
  2. A skill `compose-tese-knowledge` produz um bloco de conhecimento juridico com rastreabilidade de fonte (doc validado / web / modelo) e uma secao VALIDACAO JURIDICA NECESSARIA quando nao ha documento validado do operador
  3. A cadeia de agentes gerada usa exclusivamente placeholders marcados `<STATUS:Nome>`, `<ETIQUETA:Nome>` etc. — zero UUIDs fabricados — e inclui bloco de sobreposicao de prompt em toda transferencia entre agentes
  4. A checklist de setup lista as tarefas ordenadas (status -> etiquetas -> responsaveis -> agentes -> mensagens/videos -> integracoes) com cada placeholder da cadeia referenciado em pelo menos uma tarefa
  5. O campo de prova passa: a tese trabalhista nova gerada produz uma cadeia de agentes que o operador consegue usar como base de um funil real — estrutura coerente, sem brechas juridicas obvias, tokens colados sem erro de formato
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fundacao e Gerador | built (direct) | ✓ Complete | 2026-06-08 |
| 2. Pipeline MELHORAR | built (direct) | ✓ Complete | 2026-06-08 |
| 3. Pipeline CRIAR e Orquestrador | built (direct) | ✓ Complete | 2026-06-08 |

> Nota: as 3 fases foram construídas diretamente (sem o fluxo formal plan/execute do GSD),
> a pedido do operador. Entregável: plugin `arquiteto-liderhub` em `C:\Users\dudsl\plugins-juridico\`
> (git próprio: commits 4cc9bc5, 21d018e, 1654760). UAT formal pendente via `/gsd-verify-work`.
