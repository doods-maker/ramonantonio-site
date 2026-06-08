# Stack Research

**Domain:** Claude Code plugin — meta-agent that builds and improves LiderHub WhatsApp AI agent prompts for a Brazilian law firm
**Researched:** 2026-06-08
**Confidence:** HIGH — all plugin conventions verified against official `plugin-dev` plugin in the user's local Claude Code installation; LiderHub format verified against the official manual and a real 8-agent funnel prompt

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Claude Code Plugin System | current (user already on it) | Runtime and package format | Zero infra; user already operates `triagem-previdenciaria` in this environment; no new tooling needed |
| Markdown + YAML frontmatter | n/a | Agent definitions, skill files, commands | The native format the Claude Code plugin system expects; auto-discovered |
| JSON | n/a | Plugin manifest (`plugin.json`), data store (`data/*.json`) | Required by plugin manifest spec; used by triagem analog for leads.json |
| PowerShell | built-in (Windows 11) | Shell for skill `shell:` hints and script execution in hooks | User environment is Windows; triagem already uses `shell: powershell`; use PowerShell syntax in scripts and `!` inline commands |
| Node.js (optional) | ≥18 | Dashboard generator (`build_dashboard.js`) analog — only if a setup-checklist HTML report is wanted | Triagem uses Node for dashboard; only needed if you want to generate an HTML checklist; the primary deliverable is plain-text prompt blocks so Node is optional for v1 |

### Supporting Libraries / Tools

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `Glob` tool (built-in) | Enumerate conversation `.txt` files in `data/conversas/` | In `MELHORAR` skill when scanning multiple conversation files — never use shell globs in Bash/PowerShell paths (blocked by permission validation; triagem docs confirm this) |
| `Read` tool (built-in) | Load `.txt` conversations, SKILL reference docs, existing LiderHub prompt files | All data ingestion — read the existing prompt text before revising (MELHORAR mode) |
| `Write` tool (built-in) | Persist output prompt blocks, checklist, updated data files | Output phase of both modes |
| `WebSearch` / `WebFetch` tools (built-in) | Web research on legal doctrine in CRIAR mode | Only when the user has not supplied a validated legal doc — lowest-trust source layer |
| Chart.js (CDN) | Optional: funnel/checklist HTML dashboard | Copy triagem's dashboard pattern if a visual checklist is wanted; embeds via CDN so no npm needed |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `${CLAUDE_PLUGIN_ROOT}` env var | Portable path anchor for all intra-plugin references | Use in every path inside skill bodies, hook commands, and script args; never hardcode absolute paths |
| Claude Code plugin validator (`plugin-dev` plugin) | Validate manifest and skill/agent files | Already installed; run `/create-plugin` or ask `plugin-validator` agent to check structure |
| `data/conversas/` folder | LGPD-isolated inbox for WhatsApp `.txt` files | Mirrors triagem's pattern; keep sensitive lead conversations local, never referenced from hooks or external calls |

---

## Exact File / Folder Structure for the Plugin

```
arquiteto-agentes-liderhub/
├── .claude-plugin/
│   └── plugin.json                   # Required manifest (kebab-case name)
│
├── commands/
│   ├── criar.md                      # /criar [tese] — CRIAR mode entry point
│   └── melhorar.md                   # /melhorar [arquivo|texto] — MELHORAR mode entry point
│
├── agents/
│   └── arquiteto.md                  # Main orchestrator agent
│
├── skills/
│   ├── criar-agentes/
│   │   ├── SKILL.md                  # Orchestrates CRIAR mode: knowledge → prompt chain → checklist
│   │   └── references/
│   │       └── liderhub-token-spec.md  # Canonical LiderHub token/JSON reference (extracted from Manual)
│   │
│   ├── melhorar-agentes/
│   │   ├── SKILL.md                  # Orchestrates MELHORAR mode: ingest → diagnose → revise
│   │   └── references/
│   │       └── funil-aux-acidente.md   # The 8 real agent prompts as reference corpus
│   │
│   ├── analisar-conversas/
│   │   └── SKILL.md                  # Read ≥20 WhatsApp .txt files, classify drop-off pattern per agent/turn
│   │
│   ├── diagnostico-funil/
│   │   └── SKILL.md                  # Map drop-off findings to specific agent + prompt weakness
│   │
│   ├── redigir-prompt-liderhub/
│   │   ├── SKILL.md                  # The format-conformance skill: write/revise prompt blocks in exact LiderHub syntax
│   │   └── references/
│   │       └── exemplos-reais.md       # Agente 1-8 aux-acidente as annotated examples
│   │
│   ├── compor-conhecimento-juridico/
│   │   ├── SKILL.md                  # Layer validated doc + web research + model knowledge into legal brief
│   │   └── references/
│   │       └── teses-conhecidas.md     # Seed knowledge for previdenciário/trabalhista teses
│   │
│   └── checklist-setup/
│       └── SKILL.md                  # Emit setup checklist (status, etiquetas, responsáveis, mensagens, integrações)
│
└── data/
    ├── conversas/                    # Drop .txt WhatsApp exports here (LGPD-sensitive; local only)
    ├── prompts-referencia/           # Existing LiderHub prompt files (.md or .txt) to use in MELHORAR
    └── teses/                        # User-supplied validated legal docs per tese
```

**Why this structure:**
- Mirrors `triagem-previdenciaria` exactly: `.claude-plugin/`, `agents/`, `skills/`, `data/` — user already knows this mental model
- Two slash commands (`/criar`, `/melhorar`) give the two modes discoverable entry points with argument-hints
- One orchestrator agent (`arquiteto`) handles both modes and delegates to skills, same as `triador` delegates to `leitura-contexto` → `analise-auxilio-acidente` → etc.
- Skills are domain-specific and composable: `redigir-prompt-liderhub` is called by both modes; `analisar-conversas` is called only by MELHORAR
- `data/conversas/` follows triagem's established LGPD isolation pattern

---

## Plugin Manifest (`plugin.json`)

```json
{
  "name": "arquiteto-agentes-liderhub",
  "version": "1.0.0",
  "description": "Constrói e melhora prompts de agentes LiderHub para funis de captação jurídica (previdenciário/trabalhista), a partir de teses jurídicas e conversas reais de leads.",
  "author": {
    "name": "Ramon Antonio Advogados Associados",
    "email": "ramonantonio.advogados@gmail.com"
  },
  "license": "MIT"
}
```

All other component locations rely on auto-discovery (default `commands/`, `agents/`, `skills/` directories). No custom path overrides needed.

---

## Agent Definition Format (`agents/arquiteto.md`)

```markdown
---
name: arquiteto
description: Use this agent when the user wants to build or improve LiderHub WhatsApp agent prompts for a legal funnel. Typical triggers include running /criar with a legal tese, running /melhorar with conversation files or paste, and asking to diagnose why leads are dropping off a funnel. See "When to invoke" in the agent body for worked scenarios.
model: inherit
color: magenta
tools: ["Read", "Write", "Glob", "WebSearch", "WebFetch", "Bash"]
---

Você é o **arquiteto**, especialista em construção e otimização de agentes LiderHub para funis de captação jurídica...
```

Key agent frontmatter fields (verified against `plugin-dev` official skill):
- `name` — kebab-case, 3-50 chars, start/end alphanumeric
- `description` — "Use this agent when..." prose; triggers dispatch by the harness
- `model: inherit` — use parent model unless a specific capability is needed
- `color` — one of `blue`, `cyan`, `green`, `yellow`, `magenta`, `red`
- `tools` — restrict to minimum needed; `WebSearch`/`WebFetch` needed for CRIAR mode legal research

Note: `triador.md` in the existing plugin has `skills: [...]` in frontmatter — this is a user-defined convention for documentation/readability, not an official Claude Code field. The official frontmatter spec (from `plugin-dev/skills/agent-development`) only defines `name`, `description`, `model`, `color`, and `tools`. Keep the `skills:` hint as a comment or drop it.

---

## Skill File Format (`SKILL.md`)

```markdown
---
name: redigir-prompt-liderhub
description: This skill should be used when the user asks to "escrever um prompt LiderHub", "redigir agentes", "montar a cadeia de agentes", "revisar prompts", or when any skill needs to emit a final LiderHub prompt block conforming to platform syntax (tokens JSON, @menções, sobreposição).
version: 0.1.0
---

# Redigir prompt LiderHub

## Objetivo

...
```

Frontmatter rules (verified from `plugin-dev/skills/skill-development`):
- `name` — kebab-case identifier
- `description` — **third-person** ("This skill should be used when...") with specific trigger phrases quoted in "quotes"
- `version` — semver, optional but recommended
- Body — **imperative/infinitive form** ("Verificar os tokens antes de..."), NOT second person ("Você deve...")
- Target body length: 1,500–2,000 words; move detailed reference material to `references/` subdirectory

---

## Command File Format (`commands/criar.md`)

```markdown
---
description: Constrói a cadeia completa de agentes LiderHub para uma nova tese jurídica
argument-hint: [tese] [caminho-doc-validado]
allowed-tools: Read, Write, Glob, WebSearch, WebFetch, Bash
---

# Modo CRIAR — Arquiteto de Agentes LiderHub

A tese jurídica é: $1
Documento validado (opcional): $2

...
```

Command frontmatter fields (verified from `plugin-dev/skills/command-development/references/frontmatter-reference.md`):
- `description` — ≤60 chars; shown in `/help`
- `argument-hint` — `[arg]` per positional arg; user sees this in autocomplete
- `allowed-tools` — pre-approves tools so Claude doesn't prompt for each; use most restrictive set that works
- Arguments accessible as `$1`, `$2`, ..., `$ARGUMENTS`

---

## LiderHub Output-Format Spec

This is the format constraint the `redigir-prompt-liderhub` skill must produce. Every generated or revised prompt must conform exactly — the operator pastes the output directly into the LiderHub UI.

### Token JSON Shapes (inline in prompt text, no code fences)

All tokens appear inline in the prompt body, surrounded by natural-language instructions. They are JSON objects embedded in the prompt string:

**Status token:**
```json
{"type":"status","label":"<nome-do-status>","uuid":"<uuid-do-workspace>","redeference_id":"ref-<random>"}
```

**Responsável / transferência de agente:**
```json
{"type":"responsavel","label":"#NN - <nome-do-agente>","uuid":"<uuid>","redeference_id":"ref-<random>","assigned_type":"agent"}
```
For human:
```json
{"type":"responsavel","label":"<nome-humano>","uuid":"<uuid>","redeference_id":"ref-<random>","assigned_type":"user"}
```

**Etiqueta:**
```json
{"type":"etiqueta","label":"<nome>","uuid":"<uuid>","redeference_id":"ref-<random>"}
```

**Departamento:**
```json
{"type":"departamento","label":"<nome>","uuid":"<uuid>","redeference_id":"ref-<random>"}
```

**Mensagem (template de mídia/vídeo):**
```json
{"type":"mensagem","label":"<nome-do-template>","uuid":"<uuid>","redeference_id":"ref-<random>"}
```

**Tool (ferramentas internas da plataforma):**
```json
{"type":"tool","label":"<nome>","uuid":"<uuid-ou-slug>","redeference_id":"ref-<random>"}
```
Known slugs: `consultar-base-conhecimento`, `desativar-ia`, `saveName`

**Notify:**
```json
{"type":"notify","label":"Notificar <NOME>","uuid":"<uuid>","redeference_id":"ref-<random>"}
```

**General-data (dados globais do workspace):**
```json
{"type":"general-data","label":"<descricao>","uuid":"<slug>","redeference_id":"ref-<random>"}
```
Known slugs: `office_address`

**UUID policy (critical — from PROJECT.md and Agente 1):**
- **MELHORAR mode:** Preserve and reuse UUIDs already present in the current prompts. Never generate fake UUIDs.
- **CRIAR mode (new tese):** Use readable placeholder notation instead of UUID: `<STATUS:Desqualificado>`, `<RESPONSAVEL:#03-Sequelas>`, `<ETIQUETA:Acidente>`. Accompany with a setup checklist telling the operator what to create in LiderHub to get the real UUID.

### @mentions

Agents, humans, and knowledge bases are referenced with `@`:
- `@nome-do-agente` — transfers conversation to that LiderHub agent
- `@nome-humano` — transfers to human operator
- `@base de conhecimento` — tells the AI to query the agent's knowledge base

Arrobas vermilhos (red @) in the LiderHub UI mean the referenced item does not exist in the workspace — a setup-checklist item to fix.

### Literal-message Quoting Convention

When the prompt instructs the agent to send an exact message to the lead, wrap the message in double asterisks and quotes:
```
"**Olá! Seja bem vindo ao escritório Ramon Antonio Advogados...**"
```
Single-message rule: one question or message per instruction block, except when a media token immediately precedes the next message.

### Prompt-overlap (Sobreposição) Pattern

At the handoff from agent A to agent B, agent A's prompt must:
1. Execute the `{"type":"responsavel",...}` token to transfer to agent B
2. Immediately send the **first question of agent B** in the same instruction
3. Never say "Vou te transferir..." — the handoff must be imperceptible

Example instruction block (end of Agent A):
```
Assim que confirmar que o lead não tem advogado e não recebe benefício do INSS, execute {"type":"responsavel","label":"#03 - Sequelas [aux acidente]","uuid":"<UUID>","redeference_id":"ref-<id>","assigned_type":"agent"} e diga "Você ficou com alguma sequela ou limitação por conta do acidente?"
```

### Anti-patterns the skill must block

| Anti-pattern | Platform symptom | Fix |
|---|---|---|
| Generic instruction ("qualifique o lead") | AI hallucinates questions; poor qualification | Replace with explicit question text + conditional branches |
| `"Vou transferir para o especialista"` without overlap | Agent announces transfer but does not execute it | Add first question of next agent before the `@` mention |
| Leaving paths untrained ("pontas soltas") | AI invents answers when lead goes off-script | Cover every scenario branch including objeções, dúvidas, fora do escopo |
| Initial-conflict (lead's first message contains data matching a conditional) | Agent skips questions and jumps to condition | Add explicit `Sempre inicie por aqui, independente do conteúdo inicial` anchor |
| Removing etiquetas via prompt | Not supported by the platform | Use LiderHub Flows/automations instead; note in checklist |
| Follow-up via prompt | Not supported by the platform | Use LiderHub Follow-up feature; note in checklist |

### Prompt-section structure observed in Agente 1 (reference pattern)

```
> [Persona/contexto do agente — parágrafo de abertura]

## #INSTRUÇÕES GERAIS
- [regras universais do agente]

---
## [SEÇÃO ESPECÍFICA 1]  (ex: #TRIAGEM MÍNIMA OBRIGATÓRIA)
[numbered steps or bullets]

---
## [SEÇÃO ESPECÍFICA 2]  (ex: REGRA DE FECHAMENTO)
**Gatilhos:** ...
**Ação obrigatória:** ...

---
## ##[ESTADO/ETAPA]  (ex: ##RECEPÇÃO, ##ACIDENTE, ##DOENÇA)
**→ [ação token] e diga "[mensagem literal]"**
- Se [condição] = [próximo token] e [próxima mensagem]
```

The `redigir-prompt-liderhub` skill must emit prompts following this exact section structure.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Claude Code plugin (agent + skills) | Standalone Python CLI | User already operates in Claude Code; no new infra; zero context-switch cost |
| Claude Code plugin | Web app (Next.js/FastAPI) | PROJECT.md explicitly excludes web app for v1; adds deployment complexity the user doesn't want |
| Inline tokens as JSON objects | Custom DSL for tokens | LiderHub natively uses JSON tokens; the skill must emit what the platform parses, not an abstraction |
| UUID placeholders + checklist for new teses | Generating fake UUIDs | Fake UUIDs would be invalid in the LiderHub workspace; checklist approach matches PROJECT.md decision |
| `data/conversas/` local folder | Cloud upload | LGPD compliance; conversations contain CPF, names, sensitive data; keep strictly local |
| Separate skills per concern | Monolithic agent prompt | Mirrors triagem-previdenciaria's proven pattern; skills are independently testable and reusable across modes |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Absolute hardcoded paths in skill bodies | Plugin installs to different locations; paths break | `${CLAUDE_PLUGIN_ROOT}/data/conversas/` everywhere |
| `Get-ChildItem` / `ls *` shell glob in Bash/PowerShell | Blocked by Claude Code permission validation (documented in triagem's `triagem` SKILL.md) | `Glob` tool with `${CLAUDE_PLUGIN_ROOT}/data/conversas/*.txt` pattern |
| Second-person writing in SKILL.md body ("Você deve...") | Official skill-development spec requires imperative form; second person reduces clarity for AI consumers | Imperative: "Verificar os tokens...", "Emitir o bloco de prompt..." |
| First-person writing in agent body ("Eu sou...") | Official agent-development spec requires second-person for agent system prompts | "Você é o arquiteto..." |
| Real UUIDs for new teses | UUIDs are workspace-specific; AI cannot know them | `<PLACEHOLDER:descricao>` + setup checklist |
| Token keys like `"type":"transfer"` (invented) | Only the 7 token types documented in the manual are valid: `status`, `responsavel`, `etiqueta`, `departamento`, `mensagem`, `tool`, `notify`, `general-data` | Use only the validated token types above |
| Instructing the agent to "remove etiquetas" via prompt | Explicitly not supported by LiderHub | Note as a setup-checklist item using LiderHub automations |
| Instructing the agent to do "follow-up" via prompt | Explicitly not supported by LiderHub | Note as checklist item using LiderHub Follow-up feature |
| npm packages or pip installs | No runtime dependency install in the plugin; Claude Code plugins are file + prompt based | Pure Markdown/JSON/PowerShell/Node scripts that rely on globally available runtimes only |

---

## Stack Patterns by Mode

**CRIAR mode (`/criar [tese]`):**
- Skill chain: `compor-conhecimento-juridico` → `redigir-prompt-liderhub` → `checklist-setup`
- Knowledge layer: user-supplied doc in `data/teses/` (highest trust) → `WebSearch`/`WebFetch` for doctrine updates (medium trust) → model knowledge (lowest trust; always flag)
- Output: full multi-agent prompt chain as copyable text blocks + setup checklist

**MELHORAR mode (`/melhorar [arquivo|texto]`):**
- Skill chain: `analisar-conversas` → `diagnostico-funil` → `redigir-prompt-liderhub`
- Input: `.txt` files in `data/conversas/` (or pasted text) + existing prompt files in `data/prompts-referencia/`
- Output: revised prompts with same UUIDs from originals + diagnosis summary

**Transversal (both modes):**
- `redigir-prompt-liderhub` skill is the canonical format-enforcement gate — every token, literal message, @mention, and overlap pattern must pass through it
- `arquiteto` agent orchestrates mode selection and delegates; mirrors how `triador` delegates to skills

---

## Version Compatibility

| Component | Constraint | Notes |
|-----------|-----------|-------|
| Claude Code plugin system | Current (as installed) | Structure verified against official `plugin-dev` plugin in user's `~/.claude/plugins/` cache |
| PowerShell | ≥5.1 (Windows built-in) | Available; used for `shell: powershell` in skills that run scripts |
| Node.js | ≥18 (optional) | Only if dashboard HTML generator is added for checklist; not required for v1 |
| LiderHub prompt format | As of 2026-06 manual | Token types: `status`, `responsavel`, `etiqueta`, `departamento`, `mensagem`, `tool`, `notify`, `general-data`; overlap pattern documented; follow-up and etiqueta-removal not via prompt |

---

## Sources

- `C:\Users\dudsl\.claude\plugins\marketplaces\claude-plugins-official\plugins\plugin-dev\skills\plugin-structure\SKILL.md` — canonical plugin directory structure and manifest spec (HIGH confidence, official Anthropic plugin)
- `C:\Users\dudsl\.claude\plugins\marketplaces\claude-plugins-official\plugins\plugin-dev\skills\plugin-structure\references\manifest-reference.md` — full `plugin.json` field reference (HIGH confidence)
- `C:\Users\dudsl\.claude\plugins\marketplaces\claude-plugins-official\plugins\plugin-dev\skills\agent-development\SKILL.md` — agent frontmatter spec (HIGH confidence)
- `C:\Users\dudsl\.claude\plugins\marketplaces\claude-plugins-official\plugins\plugin-dev\skills\skill-development\SKILL.md` — skill writing conventions (HIGH confidence)
- `C:\Users\dudsl\.claude\plugins\marketplaces\claude-plugins-official\plugins\plugin-dev\skills\command-development\references\frontmatter-reference.md` — command frontmatter spec (HIGH confidence)
- `C:\Users\dudsl\plugins-juridico\triagem-previdenciaria\` — structural analog plugin (user's own, confirmed working) — plugin.json, agents/triador.md, skills/triagem/SKILL.md, skills/*/SKILL.md (HIGH confidence)
- `C:\Users\dudsl\Downloads\Manual Doc Liderhub.md` — LiderHub prompt rules, token types, overlap pattern, anti-patterns (HIGH confidence — official platform docs)
- `C:\Users\dudsl\Downloads\Agente 1 - Aux.md` — real LiderHub agent prompt for aux-acidente Agente 1 (HIGH confidence — production prompt used by the operator)
- `C:\Users\dudsl\projetos_claude\.planning\PROJECT.md` — project requirements and constraints (authoritative)

---

*Stack research for: Claude Code plugin — Arquiteto de Agentes LiderHub*
*Researched: 2026-06-08*
