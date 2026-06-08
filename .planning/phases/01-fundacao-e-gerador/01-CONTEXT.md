# Phase 1: Fundacao e Gerador - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar um plugin Claude Code instalavel (`arquiteto-liderhub`) contendo: a referencia canonica da sintaxe LiderHub (`liderhub-format-spec.md`), um registro de tokens do workspace (`token-registry.json`), e a skill `generate-liderhub-prompts` que emite prompts na sintaxe exata da LiderHub — preservando UUIDs reais (modo MELHORAR) e usando notacao de placeholder nativa da plataforma (modo CRIAR) — validada contra os 8 agentes reais do funil de auxilio-acidente. Cobre PLUGIN-02, PLUGIN-03, OUT-01..05. NAO inclui os pipelines MELHORAR/CRIAR completos (Fases 2 e 3) nem o roteamento do agente `arquiteto` (Fase 3).

</domain>

<decisions>
## Implementation Decisions

### Notacao de placeholder (modo CRIAR)
- **D-01:** Usar a notacao NATIVA da LiderHub conforme docs + exemplos — as mencoes `@nome` que aparecem como "arroba vermelho" no workspace ate serem ligadas a um item real. NAO inventar uma sintaxe de colchetes (`<STATUS:Nome>`). A notacao exata e definida no `liderhub-format-spec.md` a partir das fontes reais (Manual + 8 agentes + doc viva).

### Fonte de verdade da spec de formato
- **D-02:** O `liderhub-format-spec.md` e construido a partir de TODAS as fontes: o Manual (`Manual Doc Liderhub.md`), os 8 agentes reais (`Agente 1-8 - Aux.md`) E a doc viva puxada de `https://docs.liderhub.ai/llms.txt` (e paginas indexadas) para cobrir todos os tipos de token e regras.

### Nome e local do plugin
- **D-03:** Plugin instalado em `C:\Users\dudsl\plugins-juridico\arquiteto-liderhub\`, espelhando a estrutura do plugin existente `triagem-previdenciaria` (plugin.json + agents/ + skills/ + references/ + data/).

### Registro de tokens
- **D-04:** O `token-registry.json` e populado extraindo os UUIDs reais ja presentes nos 8 agentes de auxilio-acidente fornecidos, mais um scaffold/estrutura para o operador completar com tokens adicionais do workspace. Chaveado para permitir lookup por tipo+label e por uuid.

### Politica de UUID (load-bearing)
- **D-05:** MELHORAR preserva UUIDs/redeference_id verbatim dos prompts revisados; CRIAR nunca fabrica UUID — usa placeholder nativo. Um scan de validacao rejeita UUIDs inventados no output CRIAR.

### Claude's Discretion
- Estrutura interna exata dos arquivos (manifest fields, frontmatter da skill, schema JSON do registry) — planejador/pesquisador decide seguindo o padrao do `triagem-previdenciaria` e os docs oficiais de plugin Claude Code.
- Como exatamente validar o gerador contra os 8 agentes (round-trip / comparacao de tokens).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec de formato LiderHub (fonte de verdade do output)
- `C:\Users\dudsl\Downloads\Manual Doc Liderhub.md` — regras de prompt, 8 tipos de token, sobreposicao de prompt, alucinacao, conflito inicial, viavel vs nao-viavel via prompt
- `https://docs.liderhub.ai/llms.txt` — indice da doc viva da LiderHub; puxar paginas relevantes para completar a spec
- `C:\Users\dudsl\Downloads\Agente 1 - Aux.md` ... `Agente 8 - Aux.md` — 8 prompts reais do funil (formato-alvo exato, UUIDs reais, encadeamento)

### Estrutura do plugin (analogo a espelhar)
- `C:\Users\dudsl\plugins-juridico\triagem-previdenciaria\` — plugin.json, agents/triador.md, skills/*/SKILL.md, data/ — padrao estrutural a replicar

### Planejamento do projeto
- `.planning/PROJECT.md` — contexto, decisoes-chave, restricoes
- `.planning/REQUIREMENTS.md` — PLUGIN-02/03, OUT-01..05 (requisitos desta fase)
- `.planning/research/STACK.md` — estrutura de pastas do plugin + spec de formato LiderHub
- `.planning/research/ARCHITECTURE.md` — boundaries de componentes, references/ folder, token-registry
- `.planning/research/PITFALLS.md` — UUID fabricado, sobreposicao, conflito inicial, LGPD

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `triagem-previdenciaria` plugin: estrutura completa (manifest + agent + skills + references co-localizadas como `analise-auxilio-acidente/reference.md` + data/) — modelo direto para o `arquiteto-liderhub`.
- Os 8 agentes de auxilio-acidente: fonte de UUIDs reais para o token-registry e gabarito de validacao do gerador.
- `Valmir.txt` (em `triagem-previdenciaria/data/conversas/`): exemplo de conversa para uso nas fases seguintes.

### Established Patterns
- Plugin Claude Code: 1 agente orquestrador + skills SKILL.md por subdiretorio + references co-localizadas.
- Sintaxe LiderHub: mensagens literais entre aspas + tokens JSON de uma linha + mencoes `@` + bloco de sobreposicao no fim do prompt.

### Integration Points
- O `generate-liderhub-prompts` le `liderhub-format-spec.md` + `token-registry.json` — contrato consumido pelos pipelines das Fases 2 e 3.

</code_context>

<specifics>
## Specific Ideas

- O operador quer o output FIEL ao que a LiderHub realmente usa — placeholders e tokens devem espelhar a plataforma, nao uma convencao paralela.
- A doc viva deve ser consultada de verdade (nao so o material estatico) para nao perder tipos de token ou regras.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Os pipelines MELHORAR/CRIAR e o roteamento do agente `arquiteto` ja estao alocados nas Fases 2 e 3.)

</deferred>

---

*Phase: 1-Fundacao e Gerador*
*Context gathered: 2026-06-08*
