<!-- GSD:project-start source:PROJECT.md -->

## Project

**Arquiteto de Agentes LiderHub**

Um **agente especializado do Claude Code** (empacotado como plugin, na mesma estrutura do `triagem-previdenciaria`) que **constrói e aprimora os prompts dos agentes de IA da LiderHub** usados no funil de captação de um escritório de advocacia. Ele funciona em dois modos: **CRIAR** agentes novos para uma tese jurídica e **MELHORAR** agentes existentes a partir de conversas reais de leads no WhatsApp. O operador é o próprio advogado (Ramon Antonio Advogados / Eduardo Schlata), atuando nos nichos previdenciário e trabalhista.

**Core Value:** Transformar conversas reais de leads e teses jurídicas em **prompts de agentes LiderHub prontos para colar** que fecham mais contratos — sem escrever cada agente na mão.

### Constraints

- **Tech stack**: Agente + skills do Claude Code, empacotado como plugin — mesma estrutura de `triagem-previdenciaria`. Sem app web em v1.
- **Formato de saída**: Fidelidade exata à sintaxe de prompt da LiderHub (tokens, menções, sobreposição) — saída tem que poder ser colada sem ajuste de formato.
- **Tokens/UUIDs**: São específicos do workspace LiderHub. Agentes novos usam placeholders + checklist; revisões reutilizam os UUIDs já presentes nos prompts atuais.
- **LGPD / privacidade**: Conversas de leads contêm CPF, nome e dados sensíveis — tratar com cuidado, sem vazar para fora do ambiente local.
- **Qualidade do prompt**: Seguir a "regra de ouro" da LiderHub — prompts demonstrativos e exemplificativos, sem pontas soltas, cobrindo objeções e cenários alternativos.
- **Nicho jurídico**: Previdenciário e trabalhista (leads de advocacia).

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

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

## Exact File / Folder Structure for the Plugin

- Mirrors `triagem-previdenciaria` exactly: `.claude-plugin/`, `agents/`, `skills/`, `data/` — user already knows this mental model
- Two slash commands (`/criar`, `/melhorar`) give the two modes discoverable entry points with argument-hints
- One orchestrator agent (`arquiteto`) handles both modes and delegates to skills, same as `triador` delegates to `leitura-contexto` → `analise-auxilio-acidente` → etc.
- Skills are domain-specific and composable: `redigir-prompt-liderhub` is called by both modes; `analisar-conversas` is called only by MELHORAR
- `data/conversas/` follows triagem's established LGPD isolation pattern

## Plugin Manifest (`plugin.json`)

## Agent Definition Format (`agents/arquiteto.md`)

- `name` — kebab-case, 3-50 chars, start/end alphanumeric
- `description` — "Use this agent when..." prose; triggers dispatch by the harness
- `model: inherit` — use parent model unless a specific capability is needed
- `color` — one of `blue`, `cyan`, `green`, `yellow`, `magenta`, `red`
- `tools` — restrict to minimum needed; `WebSearch`/`WebFetch` needed for CRIAR mode legal research

## Skill File Format (`SKILL.md`)

# Redigir prompt LiderHub

## Objetivo

- `name` — kebab-case identifier
- `description` — **third-person** ("This skill should be used when...") with specific trigger phrases quoted in "quotes"
- `version` — semver, optional but recommended
- Body — **imperative/infinitive form** ("Verificar os tokens antes de..."), NOT second person ("Você deve...")
- Target body length: 1,500–2,000 words; move detailed reference material to `references/` subdirectory

## Command File Format (`commands/criar.md`)

# Modo CRIAR — Arquiteto de Agentes LiderHub

- `description` — ≤60 chars; shown in `/help`
- `argument-hint` — `[arg]` per positional arg; user sees this in autocomplete
- `allowed-tools` — pre-approves tools so Claude doesn't prompt for each; use most restrictive set that works
- Arguments accessible as `$1`, `$2`, ..., `$ARGUMENTS`

## LiderHub Output-Format Spec

### Token JSON Shapes (inline in prompt text, no code fences)

- **MELHORAR mode:** Preserve and reuse UUIDs already present in the current prompts. Never generate fake UUIDs.
- **CRIAR mode (new tese):** Use readable placeholder notation instead of UUID: `<STATUS:Desqualificado>`, `<RESPONSAVEL:#03-Sequelas>`, `<ETIQUETA:Acidente>`. Accompany with a setup checklist telling the operator what to create in LiderHub to get the real UUID.

### @mentions

- `@nome-do-agente` — transfers conversation to that LiderHub agent
- `@nome-humano` — transfers to human operator
- `@base de conhecimento` — tells the AI to query the agent's knowledge base

### Literal-message Quoting Convention

### Prompt-overlap (Sobreposição) Pattern

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

## #INSTRUÇÕES GERAIS

- [regras universais do agente]

## [SEÇÃO ESPECÍFICA 1]  (ex: #TRIAGEM MÍNIMA OBRIGATÓRIA)

## [SEÇÃO ESPECÍFICA 2]  (ex: REGRA DE FECHAMENTO)

## ##[ESTADO/ETAPA]  (ex: ##RECEPÇÃO, ##ACIDENTE, ##DOENÇA)

- Se [condição] = [próximo token] e [próxima mensagem]

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Claude Code plugin (agent + skills) | Standalone Python CLI | User already operates in Claude Code; no new infra; zero context-switch cost |
| Claude Code plugin | Web app (Next.js/FastAPI) | PROJECT.md explicitly excludes web app for v1; adds deployment complexity the user doesn't want |
| Inline tokens as JSON objects | Custom DSL for tokens | LiderHub natively uses JSON tokens; the skill must emit what the platform parses, not an abstraction |
| UUID placeholders + checklist for new teses | Generating fake UUIDs | Fake UUIDs would be invalid in the LiderHub workspace; checklist approach matches PROJECT.md decision |
| `data/conversas/` local folder | Cloud upload | LGPD compliance; conversations contain CPF, names, sensitive data; keep strictly local |
| Separate skills per concern | Monolithic agent prompt | Mirrors triagem-previdenciaria's proven pattern; skills are independently testable and reusable across modes |

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

## Stack Patterns by Mode

- Skill chain: `compor-conhecimento-juridico` → `redigir-prompt-liderhub` → `checklist-setup`
- Knowledge layer: user-supplied doc in `data/teses/` (highest trust) → `WebSearch`/`WebFetch` for doctrine updates (medium trust) → model knowledge (lowest trust; always flag)
- Output: full multi-agent prompt chain as copyable text blocks + setup checklist
- Skill chain: `analisar-conversas` → `diagnostico-funil` → `redigir-prompt-liderhub`
- Input: `.txt` files in `data/conversas/` (or pasted text) + existing prompt files in `data/prompts-referencia/`
- Output: revised prompts with same UUIDs from originals + diagnosis summary
- `redigir-prompt-liderhub` skill is the canonical format-enforcement gate — every token, literal message, @mention, and overlap pattern must pass through it
- `arquiteto` agent orchestrates mode selection and delegates; mirrors how `triador` delegates to skills

## Version Compatibility

| Component | Constraint | Notes |
|-----------|-----------|-------|
| Claude Code plugin system | Current (as installed) | Structure verified against official `plugin-dev` plugin in user's `~/.claude/plugins/` cache |
| PowerShell | ≥5.1 (Windows built-in) | Available; used for `shell: powershell` in skills that run scripts |
| Node.js | ≥18 (optional) | Only if dashboard HTML generator is added for checklist; not required for v1 |
| LiderHub prompt format | As of 2026-06 manual | Token types: `status`, `responsavel`, `etiqueta`, `departamento`, `mensagem`, `tool`, `notify`, `general-data`; overlap pattern documented; follow-up and etiqueta-removal not via prompt |

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

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
