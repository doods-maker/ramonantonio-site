# Arquiteto de Agentes LiderHub

## What This Is

Um **agente especializado do Claude Code** (empacotado como plugin, na mesma estrutura do `triagem-previdenciaria`) que **constrói e aprimora os prompts dos agentes de IA da LiderHub** usados no funil de captação de um escritório de advocacia. Ele funciona em dois modos: **CRIAR** agentes novos para uma tese jurídica e **MELHORAR** agentes existentes a partir de conversas reais de leads no WhatsApp. O operador é o próprio advogado (Ramon Antonio Advogados / Eduardo Schlata), atuando nos nichos previdenciário e trabalhista.

## Core Value

Transformar conversas reais de leads e teses jurídicas em **prompts de agentes LiderHub prontos para colar** que fecham mais contratos — sem escrever cada agente na mão.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(Nenhum ainda — entregar para validar)

### Active

<!-- Current scope. Building toward these. -->

**Modo MELHORAR (otimizador de funil):**
- [ ] Ingerir múltiplas conversas reais de WhatsApp (txt exportado ou colado, formato igual ao `Valmir.txt`)
- [ ] Diagnosticar onde o lead trava/some no funil — apontar agente específico, pergunta específica e padrão de perda
- [ ] Devolver os prompts revisados na sintaxe exata da LiderHub, prontos para colar
- [ ] Preservar e reutilizar os tokens/UUIDs existentes dos prompts atuais ao revisar

**Modo CRIAR (construtor de teses):**
- [ ] Receber uma tese jurídica como comando (ex.: "auxílio-acidente", nova trabalhista)
- [ ] Compor o conhecimento jurídico a partir de fontes em camadas: doc validado fornecido pelo usuário (quando houver) + pesquisa web + conhecimento da IA
- [ ] Gerar a cadeia completa de agentes LiderHub na sintaxe exata da plataforma (mensagens literais + tokens JSON de ação + `@menções` + sobreposição de prompt)
- [ ] Emitir tokens novos como placeholders marcados (ex.: `<STATUS:Desqualificado>`) quando o UUID ainda não existe no workspace
- [ ] Produzir uma checklist de setup do que criar na LiderHub antes de ativar (status, etiquetas, responsáveis, mensagens/vídeos, integrações)

**Transversal (qualidade LiderHub):**
- [ ] Respeitar os anti-padrões da plataforma: evitar alucinação, tratar conflito inicial, aplicar sobreposição de prompt na transferência entre agentes
- [ ] Campo de prova v1: melhorar o funil de auxílio-acidente existente (8 agentes) e criar 1 tese nova

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Interface web própria — fica para milestone futuro; o agente roda no Claude Code, mesma forma que o usuário já opera
- Publicar/ativar agentes direto na LiderHub via API — o operador cola os prompts manualmente na plataforma (entrega é o texto pronto + checklist)
- Atender leads em tempo real — este agente é ferramenta de bastidor (build/otimização), não o bot que conversa com o lead
- Nichos fora de previdenciário e trabalhista — foco declarado do escritório

## Context

- **Ecossistema do operador:** já usa Claude Code com o plugin `triagem-previdenciaria` (agente `triador` + skills) em `C:\Users\dudsl\plugins-juridico\`. O entregável deve espelhar essa estrutura (1 agente especializado + skills de apoio).
- **LiderHub:** plataforma de atendimento WhatsApp onde cada "agente" é um bot guiado por um prompt. Sintaxe do prompt: mensagens literais entre aspas + tokens de ação em JSON (`{"type":"status"...}`, `{"type":"responsavel"...}`, `{"type":"etiqueta"...}`, `{"type":"mensagem"...}`, `{"type":"tool"...}`, `{"type":"notify"...}`, `{"type":"general-data"...}`), menções `@agente`/`@humano` e base de conhecimento. Docs: https://docs.liderhub.ai/llms.txt
- **Multi-agente + sobreposição de prompt:** o funil é dividido em vários agentes (cada etapa da jornada); a transferência entre eles deve ser imperceptível — o agente atual já envia a 1ª pergunta do próximo antes de transferir.
- **Material de referência fornecido:** Manual da LiderHub (`Manual Doc Liderhub.md`), 8 prompts do funil de auxílio-acidente (`Agente 1-8 - Aux.md`), e 1 conversa de teste (`Valmir.txt`).
- **Funil aux-acidente atual (8 agentes):** triagem → segurado → sequelas → nexo doença/trabalho → ... → proposta → contrato → agendador de reunião.

## Constraints

- **Tech stack**: Agente + skills do Claude Code, empacotado como plugin — mesma estrutura de `triagem-previdenciaria`. Sem app web em v1.
- **Formato de saída**: Fidelidade exata à sintaxe de prompt da LiderHub (tokens, menções, sobreposição) — saída tem que poder ser colada sem ajuste de formato.
- **Tokens/UUIDs**: São específicos do workspace LiderHub. Agentes novos usam placeholders + checklist; revisões reutilizam os UUIDs já presentes nos prompts atuais.
- **LGPD / privacidade**: Conversas de leads contêm CPF, nome e dados sensíveis — tratar com cuidado, sem vazar para fora do ambiente local.
- **Qualidade do prompt**: Seguir a "regra de ouro" da LiderHub — prompts demonstrativos e exemplificativos, sem pontas soltas, cobrindo objeções e cenários alternativos.
- **Nicho jurídico**: Previdenciário e trabalhista (leads de advocacia).

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Entregar como agente Claude Code (plugin), não app web | Mesmo ambiente que o usuário já opera; zero infra; espelha o `triagem-previdenciaria` | — Pending |
| Dois modos: CRIAR e MELHORAR | Cobre os dois usos reais — montar tese nova e otimizar funil existente | — Pending |
| Conhecimento jurídico em camadas (doc validado + web + IA) no modo CRIAR | Equilibra rigor (doc do usuário), atualidade (web) e cobertura (IA) | — Pending |
| MELHORAR entrega diagnóstico + prompts revisados | Operador quer ver onde perde lead E receber a correção pronta | — Pending |
| Tokens novos como placeholders + checklist de setup | UUIDs são do workspace e não existem para tese nova; evita alucinar IDs | — Pending |
| v1 prova no aux-acidente, depois generaliza | Comprovar valor no funil existente (8 agentes + conversas) antes de virar ferramenta genérica | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-08 after initialization*
