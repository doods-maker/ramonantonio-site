# Feature Research

**Domain:** Prompt engineering / conversational-funnel-optimization meta-agent (Claude Code plugin)
**Researched:** 2026-06-08
**Confidence:** HIGH — grounded in real LiderHub prompt syntax, 8 actual funnel agents, and 1 real lead conversation

---

## The Two Modes That Drive Every Feature Decision

**MELHORAR** — Input: N real WhatsApp conversations (txt format, same as Valmir.txt).
Output: diagnostic report identifying drop-off patterns by agent + revised prompts ready to paste.

**CRIAR** — Input: a juridical tese name (e.g. "auxílio-doença", "acidente de trabalho trabalhista").
Output: full multi-agent LiderHub prompt chain in exact platform syntax + setup checklist for the workspace.

Every feature below is mapped to the mode(s) it serves.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features the tool is useless without. Missing any of these = the tool cannot perform its core job.

| Feature | Why Expected | Complexity | Mode | Notes |
|---------|--------------|------------|------|-------|
| **Conversation ingestion and parsing** | Raw WhatsApp exports (Valmir.txt format) must be digested into structured turn-by-turn events: speaker, timestamp, content type (text/audio transcript/silence gap) | MEDIUM | MELHORAR | The format already exists — lines interleave bot and lead turns with timestamps. Parser must handle audio narrations as text, long emotional rambles, and partial responses |
| **Agent boundary detection** | Identify which LiderHub agent handled each segment of a conversation — the funnel has 8 agents and transitions are designed to be invisible to the lead | MEDIUM | MELHORAR | Requires recognizing status tokens, responsavel transfers, and question patterns in the reference prompts to infer which agent is speaking |
| **Drop-off pattern diagnosis** | Detect the specific question/moment where lead goes silent, becomes evasive, or gives a disqualifying answer, then match it to the responsible prompt instruction | HIGH | MELHORAR | Core analytical value. Must distinguish: (a) correct disqualification, (b) incorrect disqualification due to prompt error, (c) engagement drop caused by confusing or off-putting wording |
| **Diagnostic report output** | Structured human-readable summary: which agent(s) lost leads, which questions trigger drop-off, what percentage of conversations reach each funnel stage, actionable recommendations | MEDIUM | MELHORAR | The lawyer needs to understand what broke, not just get patched prompts. Report precedes revised prompts |
| **LiderHub prompt syntax output — exact fidelity** | Generated and revised prompts must use the correct token format verbatim: `{"type":"status","label":"...","uuid":"...","redeference_id":"..."}`, `{"type":"responsavel",...}`, `{"type":"etiqueta",...}`, `{"type":"mensagem",...}`, `{"type":"tool",...}`, `{"type":"notify",...}`, `{"type":"general-data",...}`, `{"type":"checkGoogleCalendar",...}` — plus `@mention` style references and literal quoted messages | HIGH | CRIAR + MELHORAR | Wrong syntax = prompts cannot be pasted and activated. This is the non-negotiable output contract |
| **UUID/token preservation on revision** | When revising existing agents, reuse the exact UUIDs and redeference_ids already in those prompts. Never regenerate or hallucinate new IDs for existing tokens | MEDIUM | MELHORAR | UUIDs are workspace-specific. Changing them breaks all integrations. The 8 existing agents have dozens of real UUIDs that must be preserved |
| **Placeholder tokens for new teses** | For CRIAR mode, where workspace artifacts don't yet exist, emit clearly marked placeholders like `<STATUS:Qualificado>`, `<AGENTE:sequelas>`, `<MENSAGEM:boas-vindas>` rather than fabricated UUIDs | LOW | CRIAR | Prevents hallucinated IDs that would appear as broken red @mentions in LiderHub |
| **Setup checklist generation** | For new teses, emit a numbered checklist of everything the operator must create in LiderHub before activating: status values, etiquetas, agentes, mensagens/vídeos, responsáveis, integrações (ZapSign, AdvBox, Google Calendar when applicable) | MEDIUM | CRIAR | Without this, the operator cannot activate the chain even with correct prompts. Checklist maps each placeholder to the specific LiderHub section where it must be created |
| **Ingestão de múltiplas conversas** | Accept a batch of conversations (multiple .txt files or pasted blocks) for MELHORAR mode — single-conversation analysis is not statistically useful for pattern diagnosis | MEDIUM | MELHORAR | Valmir.txt is one example; real optimization requires 5+ conversations to surface repeating patterns vs one-off outliers |
| **LGPD-safe local processing** | Conversations contain CPF, full names, health information, and income data — all sensitive under LGPD Art. 5. Processing must remain local (Claude Code context, never sent to external APIs or stored in files beyond the session) | LOW (implementation) / HIGH (compliance risk if ignored) | MELHORAR | The plugin runs in Claude Code locally. The constraint is behavioral: never write CPF/nome/diagnóstico to disk, never log to external services, never include raw PII in diagnostic reports shared outside the session |

### Differentiators (Competitive Advantage)

Features that separate this tool from a lawyer simply editing prompts by hand or using a generic AI assistant.

| Feature | Value Proposition | Complexity | Mode | Notes |
|---------|-------------------|------------|------|-------|
| **LiderHub anti-pattern library** | The tool knows and actively avoids the three documented failure modes: (1) alucinação — prompt leaves a gap the AI fills with invented data; (2) conflito inicial — first lead message competes with the script's opening; (3) sobreposição de prompt missing — agent transfer is visible/jarring to lead | MEDIUM | CRIAR + MELHORAR | These are the exact failure modes in the LiderHub docs. A generic AI writer doesn't know them. The tool should flag when generated or revised prompts are vulnerable to each |
| **Sobreposição de prompt enforcement** | Every agent-to-agent transfer in generated chains must include the first question of the next agent, sent before the transfer action token. This is the "imperceptible transfer" technique from LiderHub docs | MEDIUM | CRIAR + MELHORAR | Currently one of the most common errors in hand-written LiderHub prompts. Automating it correctly is high value |
| **Juridical tese knowledge composition** | For CRIAR mode, synthesize legally accurate content: eligible regime types (CLT, avulso, segurado especial, but NOT estatutário), statutory deadlines (5-year prescription), qualifying criteria (auxílio-doença as proof of qualidade de segurado), nexo causal for occupational disease — grounded in Lei 8.213/91 | HIGH | CRIAR | This is what makes CRIAR more than a template filler. The funnel questions must encode real legal logic (e.g., the fast-track rule: if lead received auxílio-doença, skip qualidade de segurado verification entirely) |
| **Closign-intent interrupt pattern** | Detect and encode the "gatilho de fechamento" rule present in Agents 1 and 5: if lead shows purchase intent or asks about price a second time, interrupt qualification and escalate to human. Ensure every generated agent chain contains this escape hatch | MEDIUM | CRIAR + MELHORAR | Leads who are ready to sign right now are the highest-value outcome. Missing this in any agent loses a contract |
| **Per-agent drop-off attribution** | In MELHORAR mode, attribute each stall/drop to a specific agent (e.g., "Agente 2 - Segurado loses 40% of leads at the CLT verification question") rather than a vague "funnel drop" | HIGH | MELHORAR | Actionable diagnosis: the lawyer knows exactly which of the 8 agents to fix, not just that "conversions are low" |
| **Differential revision — preserve what works** | When revising prompts, output a diff-style view: what changed and why, alongside the full revised prompt. Operator can verify intent was not accidentally altered | MEDIUM | MELHORAR | Builds trust. Operators fear that AI revision will silently change a rule that was working. Showing the delta lets them accept/reject changes |
| **Layered knowledge sourcing for CRIAR** | Knowledge hierarchy: (1) user-supplied validated doc (highest trust — the operator's own tese notes or a reference manual), (2) web search for current jurisprudência, (3) model knowledge as fallback. Each claim in the funnel logic is traceable to its source tier | HIGH | CRIAR | Prevents the tool from generating legally incorrect qualification criteria — a serious risk in a juridical context |
| **Repetição de pergunta detection** | Identify when a revised or generated prompt would ask the same question the lead already answered earlier in the session — a documented anti-pattern in the existing agents ("não repetir as perguntas e questionamentos") | MEDIUM | CRIAR + MELHORAR | This is explicitly called out in Agents 1 and 3. The tool must check cross-agent context flow to ensure no question is duplicated |
| **PII anonymization in diagnostic output** | When generating the diagnostic report, replace CPF, full names, and specific health details with tokens (e.g., `[LEAD_A]`, `[CPF_REDACTED]`) so the report can be reviewed or shared without exposing raw personal data | LOW | MELHORAR | LGPD-safe reporting. The analysis uses the data; the output does not expose it |

### Anti-Features (Deliberately NOT Build)

Features that seem desirable but would be wrong for v1 or wrong altogether.

| Feature | Why Requested | Why NOT to Build | What to Do Instead |
|---------|---------------|------------------|--------------------|
| **Auto-publish prompts to LiderHub via API** | "Save me the paste step" | LiderHub's API is not documented for prompt management; forces API key storage; removes operator review of what gets activated; a bad prompt going live costs real leads | Deliver prompt text ready to copy-paste. The manual paste is a natural review gate — keep it |
| **Real-time lead conversation monitoring** | "Watch the funnel live" | This tool is a builder/optimizer, not a live monitor. Real-time monitoring is a different product requiring always-on infra, webhooks, and LiderHub API access | MELHORAR works on historical batches. Add "import last N conversations" as a workflow, not a live feed |
| **Web UI / dashboard** | "Easier to use with a visual interface" | Explicitly out of scope in PROJECT.md; zero infrastructure in v1; operator already lives in Claude Code | Deliver diagnostic reports as clean markdown or structured text in the terminal. A web UI is a milestone-2 decision after value is proven |
| **A/B testing orchestration** | "Run two prompt variants and measure" | Requires LiderHub to route leads to variant A or B, collect outcome data, and report back — none of which the plugin can control | MELHORAR already achieves iterative improvement: analyze → diagnose → revise → operator deploys → collect new conversations → repeat. That IS the A/B loop, just manually gated |
| **Generic chatbot builder** | "Support other niches / industries" | Dilutes juridical knowledge depth; creates scope creep immediately | Previdenciário + trabalhista only in v1. Architecture should be tese-agnostic internally, but exposed surface is strictly those two domains |
| **Follow-up sequence builder** | "Also write the follow-up flows" | LiderHub docs explicitly state follow-up is NOT configurable via prompt — it is a separate platform feature outside prompt scope | Note in CRIAR checklist that follow-up must be configured manually in LiderHub's Follow-Up module. Do not attempt to encode follow-up logic in the agent prompt |
| **Etiqueta removal instructions** | "Clean up etiquetas when lead is disqualified" | LiderHub docs explicitly state etiqueta removal is NOT viable via prompt | Do not include etiqueta removal tokens. Checklist should note this as a manual cleanup task |
| **Storing lead PII between sessions** | "Remember what leads said for comparison" | LGPD violation risk; leads include CPF, diagnoses, income. Claude Code has no persistent storage anyway | All analysis is session-scoped. Diagnostic patterns are stored (e.g., "question X drops 40% of leads") but never the raw conversations or identifying data |
| **Legal advice generation** | "Have the tool also write what to tell leads about their rights" | Legal advice to leads requires OAB bar compliance; the tool writes funnel scripts for an advocacia, not legal opinions | Keep all generated text in the register of "qualificação comercial" — gathering facts to assess viability — not legal advice. The existing agents model this correctly: they do not promise rights, they qualify cases |

---

## Feature Dependencies

```
[Conversation ingestion + parsing]
    └──required by──> [Agent boundary detection]
                          └──required by──> [Per-agent drop-off attribution]
                                                └──required by──> [Diagnostic report]
                                                                      └──feeds──> [Revised prompts]

[LiderHub syntax output — exact fidelity]
    └──required by──> [UUID preservation on revision]   (MELHORAR)
    └──required by──> [Placeholder tokens for new teses] (CRIAR)
    └──required by──> [Sobreposição enforcement]
    └──required by──> [Closing-intent interrupt pattern]

[Juridical tese knowledge composition]
    └──required by──> [Layered knowledge sourcing]
    └──feeds──> [Setup checklist generation]

[PII anonymization in diagnostic output]
    └──depends on──> [Conversation ingestion] (needs to know what IS PII to strip it)

[Anti-pattern library]
    └──enhances──> [Revised prompts] (post-generation validation pass)
    └──enhances──> [CRIAR chain generation] (pre-emission validation)
```

### Dependency Notes

- **Agent boundary detection requires ingestion:** You cannot attribute drop-off to a specific agent without first parsing the conversation structure and knowing the reference prompts for each agent.
- **Exact syntax fidelity is a prerequisite for everything:** If the token format is wrong, the output cannot be used. This is the foundation of both modes.
- **Juridical knowledge composition must precede CRIAR chain generation:** The funnel questions encode legal criteria (period of grace, auxílio-doença fast-track, CLT vs estatutário, prescription deadlines). Those must be sourced and validated before the prompt text is written.
- **PII anonymization is a post-processing step on the diagnostic report, not on the analysis itself:** The analysis needs the real data; only the output report gets anonymized.
- **Setup checklist depends on placeholder inventory:** The checklist is generated by collecting all `<PLACEHOLDER:...>` tokens from the generated chain and mapping each to the LiderHub UI location where the artifact must be created.

---

## MVP Definition

### Launch With (v1) — prove value on the aux-acidente funnel

- [ ] **Conversation ingestion + parsing** — handle the Valmir.txt format; support batching 3-10 conversations
- [ ] **Agent boundary detection** — reference the 8 existing aux-acidente agents to map who handled each turn
- [ ] **Drop-off pattern diagnosis + diagnostic report** — identify which agent/question loses leads, classify disqualification as correct vs likely-error
- [ ] **Revised prompt output** — produce corrected versions of problem agents in exact LiderHub syntax, preserving all real UUIDs
- [ ] **LiderHub anti-pattern validation** — flag alucinação gaps, missing sobreposição, and conflito inicial vulnerabilities in revised prompts
- [ ] **PII anonymization in report output** — strip CPF, names, and health details from the diagnostic report
- [ ] **CRIAR for one new tese** — generate a complete 6-8 agent chain for a new trabalhista tese with placeholders + setup checklist

### Add After Validation (v1.x)

- [ ] **Layered knowledge sourcing (web + doc)** — trigger: CRIAR mode proves useful but operator wants higher legal accuracy; add web fetch + operator doc ingestion
- [ ] **Differential revision view** — trigger: operator expresses concern about unintended changes during revision
- [ ] **Repetição de pergunta detection** — trigger: generated chains in CRIAR mode produce questions the lead already answered

### Future Consideration (v2+)

- [ ] **Web UI / reporting dashboard** — defer: operator confirmed they work in Claude Code; build only if distribution widens beyond the single operator
- [ ] **Closing-intent interrupt auto-detection in batch analysis** — trigger: once MELHORAR is proven, add pattern-matching for leads who signaled intent but were not correctly escalated
- [ ] **Multi-tese prompt library** — trigger: after CRIAR proves out on 2-3 teses, build a library of verified juridical knowledge bases for common previdenciário and trabalhista claims

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| LiderHub syntax output — exact fidelity | HIGH | MEDIUM | P1 |
| Conversation ingestion + parsing | HIGH | MEDIUM | P1 |
| Drop-off pattern diagnosis | HIGH | HIGH | P1 |
| Diagnostic report | HIGH | MEDIUM | P1 |
| UUID preservation on revision | HIGH | LOW | P1 |
| Placeholder tokens for new teses | HIGH | LOW | P1 |
| Setup checklist generation | HIGH | MEDIUM | P1 |
| Anti-pattern library (alucinação, conflito, sobreposição) | HIGH | MEDIUM | P1 |
| PII anonymization in report output | HIGH | LOW | P1 |
| Agent boundary detection | HIGH | MEDIUM | P1 |
| Juridical tese knowledge composition | HIGH | HIGH | P1 |
| Sobreposição de prompt enforcement | MEDIUM | MEDIUM | P2 |
| Per-agent drop-off attribution | MEDIUM | HIGH | P2 |
| Closing-intent interrupt pattern | MEDIUM | MEDIUM | P2 |
| Layered knowledge sourcing (doc + web) | MEDIUM | HIGH | P2 |
| Differential revision view | MEDIUM | LOW | P2 |
| Repetição de pergunta detection | MEDIUM | MEDIUM | P2 |
| Ingestão de múltiplas conversas (batch) | MEDIUM | LOW | P1 |

**Priority key:**
- P1: Must have for launch — the tool fails its core job without it
- P2: Should have — adds reliability and trust, add when core is stable
- P3: Nice to have, future milestone

---

## Competitor Feature Analysis

There are no direct competitors — no tool in the market combines LiderHub-specific prompt generation with funnel analytics and juridical domain knowledge. The reference points are adjacent:

| Feature | Generic AI Chatbot Builders (e.g., Landbot, ManyChat) | Generic AI Assistants (e.g., ChatGPT) | This Tool |
|---------|-------------------------------------------------------|----------------------------------------|-----------|
| LiderHub token syntax | No — platform-agnostic or different format | No — must be prompted manually each time | Yes — built-in, enforced on every output |
| Drop-off attribution to specific agent | No — they provide their own analytics dashboards | No | Yes — cross-references conversation with reference agent texts |
| Juridical qualification logic | No | Partial — knows general law but no funnel encoding | Yes — encodes Lei 8.213/91 criteria, prescription rules, fast-track paths into funnel logic |
| LGPD-aware local processing | No — cloud-based, data leaves Brazil | Partial — depends on deployment | Yes — runs in Claude Code locally, no external data transmission |
| UUID/token preservation | N/A | No | Yes — critical for revision workflow |
| Setup checklist tied to platform | No | No | Yes — maps placeholders to LiderHub UI sections |

---

## Sources

- Real LiderHub agent prompts: Agentes 1-8 — Aux.md (primary source for syntax, token types, UUID structure, and funnel logic)
- LiderHub documentation: Manual Doc Liderhub.md (prompt rules, viable/non-viable features, sobreposição, conflito inicial, alucinação)
- Real lead conversation: Valmir.txt (MELHORAR input format baseline — WhatsApp export with timestamps, interleaved bot/lead turns)
- PROJECT.md: mode definitions, constraints, out-of-scope decisions
- LGPD compliance context: Brazilian Lei 13.709/2018 and ANPD enforcement precedents (CPF as sensitive identifier, health data as sensitive category, local processing preference)
- Web research: WhatsApp funnel analytics patterns (Infobip, Flowcart, PicAssist); AI SDR agent feature landscape (Warmly, Qualified, Landbase); LGPD PII detection capabilities (PII Tools, Limina.ai, Perforce)

---
*Feature research for: Arquiteto de Agentes LiderHub (Claude Code plugin)*
*Researched: 2026-06-08*
