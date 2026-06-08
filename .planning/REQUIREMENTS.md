# Requirements: Arquiteto de Agentes LiderHub

**Defined:** 2026-06-08
**Core Value:** Transformar conversas reais de leads e teses jurídicas em prompts de agentes LiderHub prontos para colar que fecham mais contratos — sem escrever cada agente na mão.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Fundação do Plugin

- [ ] **PLUGIN-01**: O operador pode invocar o agente `arquiteto` no Claude Code, que roteia entre os modos CRIAR e MELHORAR
- [ ] **PLUGIN-02**: O plugin contém uma referência viva da sintaxe LiderHub (spec de formato) que as skills consultam ao gerar/revisar prompts
- [ ] **PLUGIN-03**: O plugin mantém um registro de tokens (UUIDs conhecidos do workspace) que as skills reutilizam

### Fidelidade de Saída LiderHub

- [ ] **OUT-01**: Todo prompt gerado/revisado usa a sintaxe exata de tokens LiderHub (JSON de uma linha por ação) e é colável sem ajuste
- [ ] **OUT-02**: Ao revisar agentes existentes, o agente preserva verbatim todos os UUIDs e `redeference_id`
- [ ] **OUT-03**: Ao criar agentes para tese nova, o agente emite placeholders marcados (ex.: `<STATUS:Qualificado>`) em vez de UUIDs inventados
- [ ] **OUT-04**: O agente valida cada prompt contra os 3 anti-padrões LiderHub (alucinação, conflito inicial, sobreposição ausente) e sinaliza vulnerabilidades
- [ ] **OUT-05**: O agente aplica sobreposição de prompt em toda transferência entre agentes (envia a 1ª pergunta do próximo agente antes do token de transferência)

### Modo MELHORAR

- [ ] **MEL-01**: O operador pode fornecer um lote de conversas de WhatsApp (txt ou colado) e o agente as parseia em turnos estruturados
- [ ] **MEL-02**: O agente identifica qual agente do funil conduziu cada trecho da conversa (boundary detection)
- [ ] **MEL-03**: O agente diagnostica onde o lead trava/some e atribui ao agente/pergunta responsável, classificando desqualificação correta vs provável erro
- [ ] **MEL-04**: O agente entrega um relatório de diagnóstico legível com perda por etapa e recomendações acionáveis
- [ ] **MEL-05**: O agente entrega os prompts revisados dos agentes problemáticos, prontos para colar
- [ ] **MEL-06**: O relatório de diagnóstico mascara CPF, nomes e dados de saúde (LGPD)

### Modo CRIAR

- [ ] **CRI-01**: O operador pode dar uma tese jurídica e o agente compõe o conhecimento jurídico necessário (doc validado + web + conhecimento da IA), com rastreabilidade de fonte
- [ ] **CRI-02**: O agente gera a cadeia completa de agentes LiderHub para a tese, na sintaxe exata, com placeholders
- [ ] **CRI-03**: O agente emite uma checklist de setup do que criar na LiderHub (status, etiquetas, responsáveis, mensagens/vídeos, integrações) antes de ativar

### Campo de Prova v1

- [ ] **PROVA-01**: O agente melhora o funil de auxílio-acidente existente (8 agentes) a partir de conversas reais
- [ ] **PROVA-02**: O agente cria 1 tese trabalhista nova de ponta a ponta como prova do modo CRIAR

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Revisão & Diagnóstico avançados

- **MEL-07**: Visão de diff nas revisões (o que mudou e por quê, ao lado do prompt completo)
- **MEL-08**: Detecção de pergunta repetida entre agentes (lead já respondeu antes)
- **MEL-09**: Auto-detecção de intenção de fechamento não escalada em análise de lote

### Conhecimento

- **CRI-04**: Biblioteca multi-tese de bases de conhecimento jurídico verificadas (previdenciário + trabalhista)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Auto-publicar prompts na LiderHub via API | API não documentada para gestão de prompts; remove o gate de revisão manual; um prompt ruim no ar custa leads. A colagem manual é o gate natural |
| Monitoramento de conversas em tempo real | Esta é ferramenta de build/otimização, não monitor ao vivo; exigiria infra always-on + webhooks + API LiderHub |
| UI / dashboard web | Fora de escopo em v1 (PROJECT.md); operador já opera no Claude Code; decisão de milestone-2 |
| A/B testing orquestrado | Exige a LiderHub rotear leads e devolver outcomes — fora do controle do plugin; o loop MELHORAR já é o A/B com gate manual |
| Builder genérico para outros nichos | Dilui a profundidade jurídica; só previdenciário + trabalhista em v1 |
| Builder de sequência de follow-up | Docs LiderHub: follow-up NÃO é configurável via prompt — é módulo separado da plataforma |
| Instruções de remoção de etiqueta | Docs LiderHub: remoção de etiqueta NÃO é viável via prompt |
| Armazenar PII de leads entre sessões | Risco LGPD (CPF, diagnósticos, renda); análise é escopada à sessão |
| Gerar parecer / aconselhamento jurídico ao lead | Exige conformidade OAB; o agente escreve scripts de qualificação comercial, não pareceres |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLUGIN-01 | Phase 3 | Pending |
| PLUGIN-02 | Phase 1 | Complete |
| PLUGIN-03 | Phase 1 | Complete |
| OUT-01 | Phase 1 | Complete |
| OUT-02 | Phase 1 | Complete |
| OUT-03 | Phase 1 | Complete |
| OUT-04 | Phase 1 | Complete |
| OUT-05 | Phase 1 | Complete |
| MEL-01 | Phase 2 | Pending |
| MEL-02 | Phase 2 | Pending |
| MEL-03 | Phase 2 | Pending |
| MEL-04 | Phase 2 | Pending |
| MEL-05 | Phase 2 | Pending |
| MEL-06 | Phase 2 | Pending |
| CRI-01 | Phase 3 | Pending |
| CRI-02 | Phase 3 | Pending |
| CRI-03 | Phase 3 | Pending |
| PROVA-01 | Phase 2 | Pending |
| PROVA-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-08*
*Last updated: 2026-06-08 after roadmap creation*
