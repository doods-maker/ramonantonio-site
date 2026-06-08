# Project Research Summary

**Project:** Arquiteto de Agentes LiderHub
**Domain:** Claude Code plugin - meta-agente que constroi e melhora prompts de agentes WhatsApp para funil juridico previdenciario/trabalhista
**Researched:** 2026-06-08
**Confidence:** HIGH

## Executive Summary

O Arquiteto de Agentes LiderHub e um plugin Claude Code (agente + skills) que opera em dois modos: CRIAR e MELHORAR. CRIAR gera uma cadeia completa de agentes LiderHub para uma tese juridica nova a partir de conhecimento juridico em camadas. MELHORAR ingere conversas reais de WhatsApp, diagnostica onde o lead trava no funil e entrega prompts revisados prontos para colar. O produto combina geracao de prompts com semantica LiderHub exata, diagnostico de funil por agente, e conhecimento juridico previdenciario/trabalhista. O campo de prova e o funil de auxilio-acidente existente (8 agentes reais) com conversas reais de leads.

A abordagem recomendada e espelhar exatamente a estrutura do plugin triagem-previdenciaria ja em producao no ambiente do operador: um agente orquestrador (arquiteto.md) + cinco skills especializadas + arquivos de referencia estaticos + pasta data/ para input/output sensivel. Dois entry points de comando (/criar, /melhorar) expoem os modos ao operador. O componente mais critico e a skill generate-liderhub-prompts, que deve emitir tokens JSON inline em linha unica, @mencoes e sobreposicao de prompt com fidelidade absoluta; qualquer desvio de formato produz prompts que nao funcionam quando colados na plataforma.

Os riscos principais sao quatro: (1) alucinacao de UUIDs - prevenida com sistema de placeholders marcados + checklist de setup para teses novas, e reutilizacao estrita de UUIDs dos inputs para revisoes; (2) sobreposicao de prompt ausente nas transferencias entre agentes - prevenida processando toda a cadeia simultaneamente, nunca agente por agente isolado; (3) alucinacao juridica nos criterios de tese - mitigada com hierarquia de fontes obrigatoria (doc validado do operador > web > modelo) e secao de validacao juridica no output; (4) exposicao de PII de leads (CPF, dados de saude) violando LGPD - o mascaramento automatico deve ser o primeiro passo do pipeline MELHORAR, antes de qualquer analise.

## Key Findings

### Recommended Stack

O plugin nao requer nenhuma tecnologia alem do que o operador ja usa. O runtime e o proprio Claude Code plugin system; os formatos sao Markdown + YAML frontmatter para skills e agentes, JSON para o manifest e para o token-registry, PowerShell para scripts utilitarios. A restricao critica de stack e o uso das ferramentas built-in (Glob para enumerar arquivos, Read para ingestao, Write para output) em vez de globs de shell, bloqueados pelo validador de permissoes do Claude Code conforme documentado no triagem-previdenciaria existente.

**Core technologies:**
- Claude Code Plugin System: runtime e formato do pacote - operador ja usa, zero nova infra
- Markdown + YAML frontmatter: formato nativo de agents/skills/commands - auto-descoberto pelo harness
- JSON: manifest plugin.json + token-registry.json para mapeamento de UUIDs do workspace
- PowerShell (built-in Windows 11): scripts utilitarios nas skills - mesmo padrao do triagem-previdenciaria
- Glob/Read/Write tools (built-in): unica forma segura de enumerar e ingerir arquivos no Claude Code

**Formato de output obrigatorio - LiderHub:**
- Tokens JSON inline (linha unica, sem indentacao): {"type":"status","label":"...","uuid":"...","redeference_id":"..."}
- Tipos validos: status, responsavel, etiqueta, departamento, mensagem, tool, notify, general-data
- Mencoes: @nome-do-agente, @nome-humano, @base de conhecimento
- Mensagens literais entre aspas duplas com texto em negrito
- Sobreposicao: agente A executa token responsavel + primeira pergunta do agente B, sem anunciar a transferencia
- Placeholders para teses novas: <STATUS:Desqualificado>, <RESPONSAVEL:#03-Sequelas> - nunca UUIDs fabricados

### Expected Features

**Must have (table stakes - v1):**
- Ingestao e parsing de conversas WhatsApp (.txt exportado, formato Valmir.txt) - batch de 3-10 arquivos
- Deteccao de agente ativo por segmento de conversa (inferida a partir dos prompts de referencia dos 8 agentes)
- Diagnostico de drop-off por agente + por pergunta especifica com classificacao (desqualificacao correta vs erro de prompt)
- Relatorio de diagnostico com PII anonimizado (CPF, nomes substituidos por [LEAD_A], [CPF_REDACTED])
- Output de prompts revisados em sintaxe LiderHub exata, preservando todos os UUIDs dos prompts originais
- Geracao de cadeia completa de agentes para tese nova com placeholders marcados
- Checklist de setup ordenado (1. Status -> 2. Etiquetas -> 3. Agentes -> 4. Mensagens/videos -> 5. Integracoes)
- Validacao de anti-padroes LiderHub: alucinacao, conflito inicial, sobreposicao ausente

**Should have (diferenciais - v1.x apos validacao):**
- Vista diff de revisao (o que mudou e por que) lado a lado com o prompt completo revisado
- Deteccao de repeticao de pergunta (mesma pergunta que lead ja respondeu em agente anterior)
- Sourcing de conhecimento juridico em camadas: doc validado do operador + WebFetch para jurisprudencia recente

**Defer (v2+):**
- Web UI / dashboard visual
- Biblioteca de teses multi-nicho verificadas
- Auto-publicacao via API LiderHub (fora de escopo por design - o paste manual e a revisao gate)

### Architecture Approach

A arquitetura segue o padrao triagem-previdenciaria comprovado: um agente orquestrador delega a uma cadeia de skills especializadas via YAML frontmatter, cada skill recebe input estruturado e produz output estruturado, e reference docs estaticos ancoram conhecimento que nao deve ser delegado a memoria do modelo. Dois entry skills de modo (CRIAR.md, MELHORAR.md) fazem o roteamento antes de invocar o orquestrador. Os dados sensiveis ficam em data/conversas/ localmente. O output final e escrito em data/output/ apenas ao final do pipeline.

**Major components:**
1. agents/arquiteto.md - orquestrador: sequencia skills, gerencia run, nao faz roteamento
2. skills/parse-conversations/ - normaliza WhatsApp .txt em turns estruturados com atribuicao de agente
3. skills/diagnose-funnel/ - mapeia drop-off por agente/pergunta/padrao a partir de turns parseados
4. skills/compose-tese-knowledge/ - constroe knowledge block juridico para uma tese (fontes em camadas)
5. skills/generate-liderhub-prompts/ - emite cadeia de agentes em sintaxe LiderHub exata (componente mais critico)
6. skills/emit-setup-checklist/ - extrai placeholders do output e gera checklist ordenado de setup
7. references/liderhub-format-spec.md - constituicao de sintaxe: unico ponto de atualizacao para regras de tokens
8. references/token-registry.json - UUIDs do workspace do operador para reutilizacao no modo MELHORAR
9. references/teses/auxilio-acidente.md - knowledge base juridico estatico por tese
10. CRIAR.md / MELHORAR.md - entry skills: roteamento, resolucao de args, escrita de output final

### Critical Pitfalls

1. **UUID hallucination** - O modelo fabrica IDs hexadecimais plausiveis para tokens de novos agentes; quando colados na LiderHub, os tokens quebram silenciosamente (arrobas vermelhos). Prevencao: invariante no gerador - todo campo uuid no output de CRIAR deve ser um placeholder <UUID:tipo:nome>; no MELHORAR, apenas UUIDs extraidos dos inputs de referencia sao validos. Scan automatico antes de entregar.

2. **Sobreposicao de prompt ausente** - Geracao de agentes isolados sem injetar a 1a pergunta do proximo agente no fechamento do atual causa handoffs visiveis que quebram a experiencia. Prevencao: processar toda a cadeia simultaneamente; para cada par (N -> N+1), extrair e injetar a 1a pergunta do N+1 no fechamento do N.

3. **Conflito inicial nao tratado** - Lead que envia 1a mensagem rica (acidente + profissao + sequela + data, como Valmir.txt) aciona condicionais do meio do funil, pulando recepcao e pedido de nome. Prevencao: todo prompt gerado deve conter ancora de ordenamento: Sempre inicie por aqui independentemente do conteudo inicial da mensagem.

4. **Alucinacao juridica** - Criterios de elegibilidade gerados sem fonte validada levam a qualificacao/desqualificacao incorreta de leads. Prevencao: hierarquia de fontes obrigatoria (doc do operador > web com verificacao de vigencia > modelo com aviso); secao VALIDACAO JURIDICA NECESSARIA em todo output sem documento validado.

5. **Exposicao de PII (LGPD)** - Conversas de leads contem CPF, nome completo e dados de saude (dados sensiveis, Lei 13.709/2018). Mascaramento deve ser o primeiro passo do pipeline MELHORAR, antes de qualquer analise.

6. **Formato incompativel para colagem** - Output com JSON indentado ou markdown explicativo intercalado obriga reformatacao manual. Prevencao: delimitadores === INICIO DO PROMPT === / === FIM DO PROMPT ===; tokens emitidos em linha unica; skill usa Agente 1 real como exemplo de referencia de formato.

## Implications for Roadmap

### Phase 1: Plugin Foundation - Estrutura, Formato e Contratos
**Rationale:** Todos os outros componentes dependem de: (a) estrutura do plugin valida, (b) liderhub-format-spec.md como referencia canonica, (c) contratos de input/output entre skills definidos antes de qualquer implementacao. UUID hallucination e formato incompativel sao invariantes do gerador - devem ser resolvidos antes do primeiro teste.
**Delivers:** Plugin instalavel com manifest valido; liderhub-format-spec.md completo com os 8 tipos de token, regras de @mencao, padrao de sobreposicao e anti-padroes; token-registry.json scaffold; teses/auxilio-acidente.md com knowledge juridico do funil existente; contratos de I/O documentados para todas as skills.
**Addresses:** LiderHub syntax exact fidelity, UUID/token preservation, placeholder tokens
**Avoids:** UUID hallucination (Pitfall 1), formato incompativel (Pitfall 6), wiring incorreto (Pitfall 8)

### Phase 2: Skill generate-liderhub-prompts - O Gerador de Prompts
**Rationale:** Esta e a skill mais critica e mais arriscada. Deve ser construida e testada standalone (contra os 8 agentes do aux-acidente como exemplos verificados) antes de ser wired no pipeline. E usada por ambos os modos; se produzir output incorreto, todos os outros componentes falham.
**Delivers:** Skill que emite prompt chain em sintaxe LiderHub exata; modo CRIAR com placeholders; modo MELHORAR com UUIDs preservados; validacao automatica de UUID e sobreposicao antes de entregar.
**Uses:** liderhub-format-spec.md como referencia canonica; exemplos reais dos Agentes 1-8 como corpus de validacao
**Avoids:** Sobreposicao ausente (Pitfall 2), conflito inicial (Pitfall 3), formato incompativel (Pitfall 6)

### Phase 3: Pipeline MELHORAR - Ingestao, Diagnostico e Revisao
**Rationale:** O modo MELHORAR tem o maior valor imediato - o operador tem 8 agentes existentes e conversas reais. O pipeline completo pode ser validado contra material conhecido (Valmir.txt + Agentes 1-8). A skill parse-conversations nao depende de nenhuma outra skill e pode ser testada isoladamente primeiro.
**Delivers:** Entry skill MELHORAR.md; skill parse-conversations (com mascaramento PII automatico como 1o passo); skill diagnose-funnel (drop-off por agente, por pergunta, com N da amostra e aviso de confianca); output em data/output/ com delimitadores de colagem.
**Implements:** Pipeline completo MELHORAR (parse -> diagnose -> generate -> output)
**Avoids:** Exposicao de PII (Pitfall 7), overfitting em amostras pequenas (Pitfall 5), contexto bloqueado por volume (Pitfall 9)

### Phase 4: Pipeline CRIAR - Knowledge Composition e Checklist
**Rationale:** O modo CRIAR depende da skill generate-liderhub-prompts (Phase 2) e adiciona a camada de knowledge juridico e o gerador de setup checklist. E naturalmente a fase seguinte apos o gerador de prompts estar validado.
**Delivers:** Entry skill CRIAR.md; skill compose-tese-knowledge com hierarquia de fontes e secao VALIDACAO JURIDICA NECESSARIA; skill emit-setup-checklist com checklist ordenado; campo de prova com 1 tese trabalhista nova.
**Addresses:** Juridical tese knowledge composition, layered knowledge sourcing, setup checklist generation
**Avoids:** Alucinacao juridica (Pitfall 4)

### Phase 5: Agente Orquestrador e Entry Commands
**Rationale:** O arquiteto.md e os commands /criar e /melhorar so podem ser finalizados quando todas as skills estao implementadas e com contratos estaveis. Construir o orquestrador antes das skills leva ao anti-pattern de agente monolitico.
**Delivers:** agents/arquiteto.md com declaracao de skills e system prompt de orquestracao; commands/criar.md e commands/melhorar.md com argument-hints e allowed-tools; teste ponta-a-ponta completo de ambos os modos.
**Implements:** Orquestracao completa; entry commands instaláveis

### Phase Ordering Rationale

- liderhub-format-spec.md e contratos de I/O sao pre-requisitos para qualquer skill - Phase 1 primeiro e obrigatorio.
- A skill generate-liderhub-prompts e o componente de maior risco tecnico - isolar em Phase 2 para testar standalone antes de wiring.
- MELHORAR (Phase 3) antes de CRIAR (Phase 4) porque o material de validacao ja existe (8 agentes + conversas reais), permitindo feedback imediato.
- O orquestrador por ultimo porque depende de todas as skills - Pattern 1 do ARCHITECTURE.md confirma isso.
- Esta ordem espelha o build order documentado no ARCHITECTURE.md (Foundation -> Core Skills -> Pipeline Skills -> Orchestration).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Parsing de WhatsApp .txt - o formato real (Valmir.txt) contem variacoes (audios como [audio], timestamps inconsistentes, mensagens fragmentadas). Verificar o arquivo Valmir.txt antes de escrever a skill de parsing.
- **Phase 4:** Web research para jurisprudencia - verificar quais ferramentas WebFetch/WebSearch sao confiaveis para legislacao previdenciaria/trabalhista em pt-BR e quais retornam legislacao revogada.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Estrutura de plugin totalmente documentada - verificada contra plugin-dev oficial e triagem-previdenciaria em producao.
- **Phase 2:** Sintaxe LiderHub totalmente documentada - tokens, @mencoes, sobreposicao verificados contra Manual oficial e Agente 1 real.
- **Phase 5:** Padrao de orquestracao totalmente documentado - triador.md e o modelo exato a seguir.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verificado contra plugin-dev oficial (Anthropic), triagem-previdenciaria (producao) e Manual LiderHub |
| Features | HIGH | Baseado em 8 prompts reais de producao, conversa real Valmir.txt e Manual LiderHub; sem especulacao |
| Architecture | HIGH | Espelha exatamente triagem-previdenciaria comprovado; data flow verificado diretamente |
| Pitfalls | HIGH | Baseado em leitura direta do Manual LiderHub, prompt real Agente 1, e conversa real com PII exposta |

**Overall confidence:** HIGH

### Gaps to Address

- **UUID registry inicial:** token-registry.json precisa ser populado pelo operador com UUIDs reais do workspace aux-acidente antes do primeiro teste do modo MELHORAR.
- **Tamanho minimo de amostra para MELHORAR:** A pesquisa recomenda 10+ conversas para diagnostico estatisticamente valido, mas o operador pode ter apenas 3-5 inicialmente. A skill deve emitir aviso explicito de baixa confianca quando N < 10, nao bloquear o uso.
- **Contexto window management:** Com 10+ conversas longas + 8 prompts de referencia, o volume pode exceder 80k+ tokens. A estrategia de batching por agente deve ser definida na skill parse-conversations antes do primeiro teste com dados reais.
- **Formato exato de @mencoes no output:** O Manual documenta @nome-do-agente mas nao especifica se ha um formato especial de renderizacao no editor da LiderHub vs o texto colado. Verificar colando um prompt gerado em agente de teste antes de Phase 3 estar completo.

## Sources

### Primary (HIGH confidence)
- C:Usersdudsl.claudepluginsmarketplacesclaude-plugins-officialpluginsplugin-dev - spec oficial de manifest, agents, skills e commands do Claude Code plugin system
- C:Usersdudslplugins-juridico	riagem-previdenciaria - plugin analogo em producao; estrutura, padroes e convencoes verificadas diretamente
- C:UsersdudslDownloadsManual Doc Liderhub.md - documentacao oficial LiderHub: tipos de token, @mencoes, sobreposicao, conflito inicial, alucinacao, features nao-suportadas
- C:UsersdudslDownloadsAgente 1 - Aux.md - prompt real de producao do funil aux-acidente; fonte canonica de tokens, UUIDs reais, estrutura de secoes e padrao de sobreposicao
- C:Usersdudslprojetos_claude.planningPROJECT.md - requirements, constraints e decisoes do projeto (fonte autoritativa)

### Secondary (MEDIUM confidence)
- Valmir.txt (conversa real exportada) - formato de input WhatsApp, PII exposta, conflito inicial em condicoes reais
- Lei 13.709/2018 (LGPD) - classificacao de dados de saude como sensiveis e obrigacoes de base legal

---
*Research completed: 2026-06-08*
*Ready for roadmap: yes*