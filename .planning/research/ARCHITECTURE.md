# Architecture Research

**Domain:** Claude Code plugin — LiderHub WhatsApp AI-agent prompt builder/optimizer for a law firm
**Researched:** 2026-06-08
**Confidence:** HIGH (based on direct inspection of the proven `triagem-previdenciaria` pattern + LiderHub manual)

## Standard Architecture

This plugin mirrors the `triagem-previdenciaria` structure exactly: one orchestrator agent file + a flat `skills/` directory + a `data/` directory + a `.claude-plugin/plugin.json` manifest. The pattern is proven in production.

### System Overview

```
C:\Users\dudsl\plugins-juridico\arquiteto-liderhub\
│
├── .claude-plugin\
│   └── plugin.json                  ← manifest (name, description, version, author)
│
├── agents\
│   └── arquiteto.md                 ← orchestrator: routes CRIAR vs MELHORAR, chains skills
│
├── skills\
│   ├── parse-conversations\
│   │   └── SKILL.md                 ← ingests raw WhatsApp .txt, normalizes turns
│   ├── diagnose-funnel\
│   │   └── SKILL.md                 ← maps drop-off per agent, per question, per pattern
│   ├── compose-tese-knowledge\
│   │   └── SKILL.md                 ← builds structured legal knowledge base for a tese
│   ├── generate-liderhub-prompts\
│   │   └── SKILL.md                 ← emits LiderHub-syntax agent chain (tokens + mentions)
│   └── emit-setup-checklist\
│       └── SKILL.md                 ← produces pre-activation checklist (statuses, labels...)
│
├── references\
│   ├── liderhub-format-spec.md      ← token syntax, mention syntax, overlap rule, anti-patterns
│   ├── token-registry.json          ← existing workspace UUIDs mapped by type+name
│   └── teses\
│       ├── auxilio-acidente.md      ← legal knowledge doc (mirrors reference.md in triagem)
│       └── [tese-nova].md           ← added when user onboards a new tese
│
├── data\
│   ├── conversas\                   ← raw WhatsApp .txt dumps (input; LGPD-sensitive)
│   ├── prompts\                     ← current agent prompts per tese (input for MELHORAR)
│   │   └── aux-acidente\
│   │       ├── agente-1.md
│   │       └── ...agente-8.md
│   └── output\                      ← generated artifacts (output; ready to paste)
│       ├── [tese]-[date]-prompts.md ← full agent chain output
│       └── [tese]-[date]-checklist.md
│
└── [entry-skill].md                 ← top-level skill file (CRIAR.md / MELHORAR.md)
                                       invoked by the user as /[skill-name]
```

### Component Responsibilities

| Component | Responsibility | Analogous to (triagem-previdenciaria) |
|-----------|----------------|----------------------------------------|
| `plugin.json` | Plugin identity and metadata | `.claude-plugin/plugin.json` |
| `agents/arquiteto.md` | Orchestrator: detects mode, sequences skills, assembles output | `agents/triador.md` |
| `skills/parse-conversations/` | Normalize raw WhatsApp export into structured turn-by-turn data with agent attribution | `skills/leitura-contexto/` |
| `skills/diagnose-funnel/` | Identify drop-off points per agent, per question, per failure pattern | `skills/analise-auxilio-acidente/` |
| `skills/compose-tese-knowledge/` | Build or load a legal knowledge block for a tese (from user doc + web + model) | `skills/analise-auxilio-acidente/` + `reference.md` combined |
| `skills/generate-liderhub-prompts/` | Emit the full LiderHub agent chain in exact platform syntax | `skills/roteiro-resposta/` |
| `skills/emit-setup-checklist/` | Produce pre-activation setup tasks for workspace configuration | `skills/dashboard/` (utility output role) |
| `references/liderhub-format-spec.md` | Authoritative, static format rule: token JSON shapes, `@mention` syntax, overlap pattern, anti-patterns | `skills/analise-auxilio-acidente/reference.md` |
| `references/token-registry.json` | Maps known workspace token names to their UUIDs (populated by operator) | No direct equivalent; new in this plugin |
| `references/teses/[tese].md` | Stable legal knowledge per tese (like reference.md — no external lookup needed) | `skills/analise-auxilio-acidente/reference.md` |
| `data/conversas/` | Input: raw WhatsApp conversation exports (.txt) | `data/conversas/` |
| `data/prompts/[tese]/` | Input: current prompt files per agent (for MELHORAR mode) | No direct equivalent |
| `data/output/` | Output: generated prompt chains and setup checklists, ready to paste | `data/leads.json` + `data/dashboard.html` |

## Recommended Project Structure

```
plugins-juridico\arquiteto-liderhub\
├── .claude-plugin\
│   └── plugin.json
│
├── agents\
│   └── arquiteto.md
│
├── skills\
│   ├── parse-conversations\
│   │   └── SKILL.md
│   ├── diagnose-funnel\
│   │   └── SKILL.md
│   ├── compose-tese-knowledge\
│   │   └── SKILL.md
│   ├── generate-liderhub-prompts\
│   │   └── SKILL.md
│   └── emit-setup-checklist\
│       └── SKILL.md
│
├── references\
│   ├── liderhub-format-spec.md
│   ├── token-registry.json
│   └── teses\
│       └── auxilio-acidente.md
│
├── data\
│   ├── conversas\
│   │   └── (WhatsApp .txt exports — operator drops files here)
│   ├── prompts\
│   │   └── aux-acidente\
│   │       └── (agente-1.md ... agente-8.md)
│   └── output\
│       └── (generated prompt chains and checklists)
│
├── CRIAR.md    ← top-level skill: entry point for CREATE mode
└── MELHORAR.md ← top-level skill: entry point for IMPROVE mode
```

### Structure Rationale

- **`agents/`:** Holds the orchestrator. Follows the triagem pattern: one `.md` file with a YAML frontmatter `skills:` list and a natural-language system prompt that chains the skills.
- **`skills/`:** Each skill is a subdirectory with a `SKILL.md`. Skills are pure prompt modules — they receive structured input and produce structured output. They do not read files directly unless granted `allowed-tools`. Skills that need a reference doc include it as a `reference.md` in the same subdirectory (exact mirror of `analise-auxilio-acidente/reference.md`).
- **`references/`:** Separates shared, static knowledge from skill logic. `liderhub-format-spec.md` is the "constitution" that `generate-liderhub-prompts` reads. `token-registry.json` holds the operator's workspace UUIDs. `teses/` holds one doc per legal thesis. These are read-only from skill perspective; updated by the operator between sessions.
- **`data/`:** Mutable runtime state, separated by purpose. `conversas/` is LGPD-sensitive input; `prompts/` is the current production funnel (MELHORAR reads it); `output/` is the generated artifacts. Mirrors `data/conversas/` and `data/leads.json` from triagem.
- **`CRIAR.md` / `MELHORAR.md`:** Top-level skill files at plugin root that serve as user-facing entry points. The user runs `/CRIAR` or `/MELHORAR` — the skill file handles argument parsing, delegates to the orchestrator agent, and produces output. This matches the `triagem/SKILL.md` pattern (which is also the top-level entry skill for that plugin).

## Architectural Patterns

### Pattern 1: Orchestrator Chains Skills via YAML Frontmatter

**What:** The orchestrator agent (`arquiteto.md`) declares its skill dependencies in a YAML `skills:` list. Claude Code loads those skill files as context. The orchestrator then references them by name in its natural-language instructions, executing them in sequence with each step's output feeding the next.

**When to use:** Whenever the task is a deterministic pipeline with well-defined steps and clear data contracts between steps. Both CRIAR and MELHORAR are exactly this.

**Trade-offs:** Very readable; easy to add/remove steps. No code wiring. Limitation: no conditional branching at the agent level — handle routing in the entry skill (CRIAR.md / MELHORAR.md) before handing off to the orchestrator.

```yaml
---
name: arquiteto
description: Constrói e melhora prompts LiderHub para o funil de captação do escritório.
skills: [parse-conversations, diagnose-funnel, compose-tese-knowledge, generate-liderhub-prompts, emit-setup-checklist]
---
```

### Pattern 2: Reference Docs as Static Knowledge Anchors

**What:** A skill that requires stable, authoritative knowledge (legal rules, platform syntax) loads a co-located `reference.md` file rather than relying on model memory. The skill's `SKILL.md` explicitly instructs: "consult [reference.md] — this knowledge is fixed, does NOT depend on external lookup."

**When to use:** For any knowledge that (a) changes rarely, (b) must be exact (legal articles, token JSON shapes), and (c) would hallucinate if left to model memory. Both the legal tese docs and the LiderHub format spec qualify.

**Trade-offs:** Makes correctness deterministic. Requires operator to keep reference docs up to date when the platform changes. Far better than letting the model invent token syntax.

**Example (from triagem pattern):**
```markdown
# analise-auxilio-acidente/SKILL.md (excerpt)
Consulte os requisitos e regras consolidadas em
[reference.md](reference.md) — esse conhecimento é fixo,
NAO depende de base externa.
```

### Pattern 3: Placeholder Tokens + Setup Checklist for New Teses

**What:** When generating prompts for a tese that has no existing workspace UUIDs, `generate-liderhub-prompts` substitutes `<STATUS:Desqualificado>`, `<ETIQUETA:Qualificado>`, etc. as human-readable placeholders. `emit-setup-checklist` then produces the ordered list of things to create in LiderHub before activating. This keeps the generated prompts correct in structure while flagging what the operator must provision.

**When to use:** CRIAR mode only. MELHORAR mode reads `token-registry.json` to reuse existing UUIDs.

**Trade-offs:** Prevents UUID hallucination (a critical correctness requirement). Adds one manual step for the operator. Acceptable because the plugin's output is paste-ready text, not a direct API call.

### Pattern 4: Dual Entry Skills for Mode Routing

**What:** Two top-level skill files (`CRIAR.md`, `MELHORAR.md`) at plugin root serve as user-facing commands. Each handles its own argument parsing, input resolution, and output path. Both delegate to `agents/arquiteto.md` but with different skill subsets and different data contracts. The orchestrator does not route — routing happens before it is invoked.

**When to use:** When a plugin has two clearly distinct execution paths that share underlying skills but differ in inputs and outputs. Cleaner than a single entry point with conditional logic.

**Trade-offs:** Slight duplication in common steps. Benefit: each mode is independently readable and testable.

## Data Flow

### MELHORAR Mode (Funnel Optimizer)

```
User runs: /MELHORAR [--tese aux-acidente]
    │
    ▼
MELHORAR.md (entry skill)
    │  resolves: data/conversas/*.txt (multiple) + data/prompts/aux-acidente/*.md
    │
    ▼
skill: parse-conversations
    │  input:  raw WhatsApp .txt exports (one or many)
    │  output: structured turn list with speaker labels, message timestamps,
    │          and agent attribution (which LiderHub agent was active per turn)
    │
    ▼
skill: diagnose-funnel
    │  input:  parsed turns + current prompt files (data/prompts/)
    │  reads:  references/liderhub-format-spec.md (to understand agent boundaries)
    │  output: drop-off report — per agent: drop rate, specific question patterns
    │          that cause silence/abandon, identified anti-patterns in current prompts
    │
    ▼
skill: generate-liderhub-prompts  [revision mode]
    │  input:  current prompt files + drop-off report + token-registry.json
    │  reads:  references/liderhub-format-spec.md (syntax constitution)
    │          references/teses/auxilio-acidente.md (legal knowledge)
    │  output: revised prompts per agent in exact LiderHub syntax,
    │          reusing existing UUIDs from token-registry.json,
    │          with inline diff-style notes on what changed and why
    │
    ▼
MELHORAR.md writes output to:
    data/output/aux-acidente-[date]-melhorado.md
    (terminal: summary of changes per agent + drop-off diagnosis)
```

### CRIAR Mode (Tese Builder)

```
User runs: /CRIAR --tese "auxilio-acidente-trabalhista"
           [--doc "path/to/user-validated-doc.md"]
    │
    ▼
CRIAR.md (entry skill)
    │  resolves: tese name + optional user-provided doc
    │
    ▼
skill: compose-tese-knowledge
    │  input:  tese name + optional user doc
    │  reads:  references/teses/[tese].md if it exists
    │  may:    search web for recent legislation/case law (under operator supervision)
    │  output: structured legal knowledge block:
    │          { tese, requisitos[], criterios_qualificacao[], objections[], agent_map[] }
    │          agent_map defines how many agents the funnel needs and what each covers
    │
    ▼
skill: generate-liderhub-prompts  [creation mode]
    │  input:  knowledge block from compose-tese-knowledge
    │  reads:  references/liderhub-format-spec.md (syntax constitution)
    │          references/token-registry.json (to reuse any matching existing tokens)
    │  output: full LiderHub agent chain in exact platform syntax:
    │          - literal messages in quotes
    │          - action tokens as JSON blocks
    │          - @agent and @human mentions
    │          - prompt overlap instructions at each agent handoff
    │          - placeholder tokens <TYPE:Name> for new workspace items
    │
    ▼
skill: emit-setup-checklist
    │  input:  generated prompts (to extract all placeholder tokens)
    │  output: ordered checklist of workspace configuration tasks:
    │          [ ] Create status "Desqualificado"
    │          [ ] Create label "Qualificado"
    │          [ ] Create agent "Triagem" and copy prompt X
    │          ... etc.
    │
    ▼
CRIAR.md writes output to:
    data/output/[tese]-[date]-prompts.md
    data/output/[tese]-[date]-checklist.md
    (terminal: summary — N agents generated, M setup tasks required)
```

### Key Data Contracts Between Skills

| From | To | Contract |
|------|----|----------|
| `parse-conversations` → `diagnose-funnel` | Structured turn list: `{speaker, message, timestamp, active_agent_id}[]` |
| `diagnose-funnel` → `generate-liderhub-prompts` (MELHORAR) | Drop-off report: `{agent_id, drop_rate, problem_questions[], anti_patterns[]}[]` |
| `compose-tese-knowledge` → `generate-liderhub-prompts` (CRIAR) | Knowledge block: `{tese, requisitos[], agent_map[], objections[], disqualifiers[]}` |
| `generate-liderhub-prompts` → `emit-setup-checklist` | Prompt chain with placeholder markers: `<TYPE:Name>` tokens extracted |

## Skill vs Reference Doc vs Stored Data — Decision Rule

| When to make it a... | Criteria | Examples |
|----------------------|----------|---------|
| **Skill (SKILL.md)** | Has processing logic — it transforms inputs to outputs using prompt instructions | `parse-conversations`, `diagnose-funnel`, `generate-liderhub-prompts` |
| **Reference doc** | Is static or changes rarely; must be exact; would hallucinate in model memory; read by skills but not modified by the pipeline | `liderhub-format-spec.md`, `auxilio-acidente.md`, `token-registry.json` |
| **Stored data / output** | Is mutable runtime state — either operator-provided input or pipeline-generated output | `data/conversas/*.txt`, `data/prompts/*.md`, `data/output/*.md` |
| **Agent** | Orchestrates the pipeline — sequences skills, handles entry/exit, manages the overall run | `agents/arquiteto.md` |
| **Entry skill** | Is the user-facing command — resolves arguments, routes to orchestrator, manages output writing | `CRIAR.md`, `MELHORAR.md` |

The key distinction between a skill and a reference doc: a skill is a prompt that *does something* (transforms data); a reference doc is knowledge that a skill *reads* to do it correctly.

## Anti-Patterns

### Anti-Pattern 1: Putting LiderHub Token Syntax in the Skill Prompt

**What people do:** Hardcode token JSON shapes, mention syntax rules, and overlap instructions inside `generate-liderhub-prompts/SKILL.md` as inline text.

**Why it's wrong:** When LiderHub updates its syntax (new token types, changed field names), you must locate and update every skill that embeds this knowledge. It also means the skill is partly documentation and partly logic — harder to read.

**Do this instead:** All syntax rules live in `references/liderhub-format-spec.md`. The skill says "consult [liderhub-format-spec.md] — use the token shapes defined there exactly." One update point.

### Anti-Pattern 2: Inventing UUIDs / Token Values

**What people do:** Generate plausible-looking UUIDs for status, label, and responsavel tokens in new tese prompts.

**Why it's wrong:** These IDs are workspace-specific. Invented IDs will silently fail when the operator pastes the prompt into LiderHub — the tokens will render as red broken mentions. This is a correctness failure, not a formatting issue.

**Do this instead:** CRIAR mode uses human-readable placeholders `<STATUS:Desqualificado>` and the setup checklist instructs the operator to create those items and substitute their real UUIDs. MELHORAR mode reads `token-registry.json` for known UUIDs.

### Anti-Pattern 3: One Giant Skill That Does Everything

**What people do:** Put parsing, diagnosis, and generation all in a single `prompt-builder/SKILL.md` to "keep it simple."

**Why it's wrong:** Skills become unmaintainable when they mix concerns. The parse step has completely different inputs and outputs from the generation step. When one breaks, you cannot isolate it. The triagem pattern proves that 4-5 focused skills are more maintainable than one monolith.

**Do this instead:** One skill per distinct transformation step, with explicit data contracts between them.

### Anti-Pattern 4: Skipping Prompt Overlap in Generated Chains

**What people do:** Generate individual agent prompts without the handoff overlap instructions, assuming "the platform will handle it."

**Why it's wrong:** LiderHub's multi-agent transfer is not imperceptible without explicit overlap. The current agent must send the first question of the next agent before transferring — otherwise the platform produces a "going to transfer you" message that breaks the illusion of a continuous conversation. This is documented in the LiderHub manual as the primary multi-agent failure mode.

**Do this instead:** `generate-liderhub-prompts` must always append a closing overlap block to each agent prompt: "When [condition], transfer to @[next-agent] and send: '[first question of next agent].'"

## Build Order (Based on Dependencies)

The components have clear dependencies. Build in this order:

**Phase 1 — Foundation (no dependencies)**
1. `plugin.json` — manifest, no logic
2. `references/liderhub-format-spec.md` — the syntax constitution; everything that generates prompts depends on it
3. `references/token-registry.json` — empty scaffold for operator to populate
4. `references/teses/auxilio-acidente.md` — legal knowledge for the v1 proof tese

**Phase 2 — Core Skills (depend on references)**
5. `skills/parse-conversations/SKILL.md` — no skill dependencies; only needs raw input
6. `skills/compose-tese-knowledge/SKILL.md` — reads `teses/` references; no skill dependency
7. `skills/generate-liderhub-prompts/SKILL.md` — reads `liderhub-format-spec.md` and `token-registry.json`; depends on 2, 3, 4

**Phase 3 — Pipeline Skills (depend on Phase 2 outputs)**
8. `skills/diagnose-funnel/SKILL.md` — consumes `parse-conversations` output; depends on 5, 7
9. `skills/emit-setup-checklist/SKILL.md` — consumes `generate-liderhub-prompts` output; depends on 7

**Phase 4 — Orchestration (depends on all skills)**
10. `agents/arquiteto.md` — chains all skills; depends on 5-9
11. `CRIAR.md` — entry skill for CREATE mode; depends on 6, 7, 9, 10
12. `MELHORAR.md` — entry skill for IMPROVE mode; depends on 5, 7, 8, 10

**Rationale:** The `generate-liderhub-prompts` skill (step 7) is the highest-value, highest-risk component — it must produce syntactically exact output. It is built before the orchestrator so it can be tested standalone against known prompt examples (the existing 8 aux-acidente agents) before being wired into the pipeline.

## Integration Points

### External Boundary: LiderHub Platform

| Boundary | Direction | Notes |
|----------|-----------|-------|
| Prompt output → LiderHub UI | Operator pastes manually | Plugin has no API integration in v1; output is text |
| LiderHub token UUIDs → `token-registry.json` | Operator copies manually | Operator reads UUIDs from LiderHub workspace settings and populates the registry |

### Internal Boundary: Data Sensitivity

| Data | Sensitivity | Handling |
|------|-------------|---------|
| `data/conversas/` | HIGH (CPF, name, health data of real leads) | Never commits to git; process locally only; no external API calls with this data |
| `data/output/` | MEDIUM (contains legal strategy) | Local only; shared only by operator choice |
| `references/` | LOW (general platform docs + legal refs) | Can be versioned in git safely |

### Internal Boundary: Skill Communication

All skill-to-skill communication is via Claude Code's in-context data passing — the output of one skill step is available in the conversation context when the next skill executes. No files are written between skill steps (unlike the triagem plugin which writes to `leads.json`). Files are only written at the end of the pipeline run by the entry skill (CRIAR.md / MELHORAR.md).

## Sources

- Direct inspection of `C:\Users\dudsl\plugins-juridico\triagem-previdenciaria\` (all files)
- `C:\Users\dudsl\Downloads\Manual Doc Liderhub.md` (prompt mechanics, overlap pattern, anti-patterns)
- `C:\Users\dudsl\projetos_claude\.planning\PROJECT.md` (requirements and constraints)

---
*Architecture research for: Claude Code plugin — Arquiteto de Agentes LiderHub*
*Researched: 2026-06-08*
