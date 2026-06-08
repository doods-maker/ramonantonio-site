# Pitfalls Research

**Domain:** Meta-agent que gera/otimiza prompts LiderHub para funil jurídico (previdenciário/trabalhista)
**Researched:** 2026-06-08
**Confidence:** HIGH — baseado em leitura direta do Manual LiderHub (alucinação, conflito inicial, sobreposição), do prompt real do Agente 1 (tokens/UUIDs wiring), e da conversa real Valmir.txt (PII + input messy).

---

## Critical Pitfalls

### Pitfall 1: Alucinação de UUIDs — o meta-agente fabrica tokens que não existem no workspace

**What goes wrong:**
O meta-agente (Claude Code) gera um prompt LiderHub contendo tokens JSON como `{"type":"status","uuid":"abc-123-xyz"}` onde o UUID foi inventado, não copiado do workspace real. Quando o operador cola esse prompt na LiderHub, o token aponta para um recurso inexistente — o status não muda, a etiqueta não é aplicada, a transferência não ocorre. O agente gerado parece correto visualmente mas está quebrado em produção.

**Why it happens:**
Claude não tem acesso ao workspace LiderHub do cliente. No modo CRIAR para teses novas, não há UUIDs reais disponíveis ainda. Sem instrução explícita, Claude tende a "preencher" os campos com valores plausíveis ao invés de usar placeholders marcados.

**How to avoid:**
- No modo CRIAR: emitir placeholders explicitamente marcados como `<UUID:status:Desqualificado>` ou `<UUID:responsavel:Agente03>`, nunca strings hexadecimais inventadas.
- No modo MELHORAR: extrair e reutilizar os UUIDs existentes dos prompts fornecidos como input (os prompts do Agente 1-8 já os contêm). Nunca substituir um UUID que já está nos prompts de referência.
- Incluir validação na skill de output: varrer o texto gerado em busca de campos `"uuid":` que não sejam placeholders marcados nem UUIDs extraídos dos inputs — e emitir aviso antes de entregar.

**Warning signs:**
- Prompt gerado contém `"uuid":"[a-f0-9-]{36}"` mas o operador não forneceu nenhum prompt de referência com esse UUID.
- O modo CRIAR produziu um prompt com `"type":"responsavel"` e um UUID que não aparece em nenhum dos arquivos de referência fornecidos.
- Arrobas vermelhos na interface LiderHub ao colar (a própria plataforma sinaliza menções para itens inexistentes no workspace).

**Phase to address:**
Fase de construção do modo CRIAR — antes de qualquer teste de campo. Deve ser uma invariante do gerador de output, não uma validação posterior.

---

### Pitfall 2: Sobreposição de prompt ausente ou inconsistente na transferência entre agentes

**What goes wrong:**
O meta-agente gera o prompt do Agente N com a instrução de transferir para o Agente N+1, mas não inclui a primeira pergunta do próximo agente no momento da transferência. O resultado: o agente atual avisa "vou te transferir" e aguarda resposta do lead — quebrando a experiência fluida. Ou pior: o agente menciona a transferência mas não executa o token `{"type":"responsavel",...}` porque não há instrução clara do que dizer junto.

**Why it happens:**
A sobreposição de prompt é um padrão não-óbvio: requer que o Agente N "conheça" a primeira pergunta do Agente N+1. Sem acesso à cadeia completa de agentes como contexto simultâneo, é fácil gerar cada agente isoladamente e ignorar a costura entre eles. O Manual LiderHub documenta explicitamente que "sem sobreposição, a IA apenas avisa sem transferir de fato".

**How to avoid:**
- O meta-agente deve processar toda a cadeia de agentes de forma conjunta, nunca agente por agente isolado.
- Para cada par (Agente N → Agente N+1), extrair a primeira pergunta do N+1 e injetá-la explicitamente no fechamento do N.
- Checklist de revisão deve verificar que toda instrução de transferência (`{"type":"responsavel",...}`) está acompanhada de uma mensagem literal para o lead.
- No modo MELHORAR, ao revisar um agente, ler o prompt do próximo antes de gerar a versão revisada.

**Warning signs:**
- Prompt gerado contém `{"type":"responsavel",...}` sem nenhuma string de mensagem imediatamente após.
- Prompt do Agente N termina com instrução de transferência mas não menciona nenhum conteúdo da primeira etapa do Agente N+1.
- Em teste com `/restart`, o bot envia "Tudo certo, vou te transferir!" e fica aguardando resposta.

**Phase to address:**
Fase de construção do modo CRIAR e do modo MELHORAR — as skills de geração de prompt devem receber a cadeia inteira como contexto, não agentes individuais.

---

### Pitfall 3: Conflito inicial não tratado — lead quebra a ordem do roteiro logo na primeira mensagem

**What goes wrong:**
O lead envia na primeira mensagem um dado que dispara uma condição do meio do funil (ex.: já menciona o acidente, a profissão, uma data), e o agente gerado pula as etapas anteriores de recepção/qualificação e executa direto aquela condição. Exemplo real: Valmir.txt — a primeira mensagem do lead já contém acidente, data (2002), profissão (pedreiro), sequela (joelho/tornozelo) e ausência de auxílio-doença. Um agente mal wired pula a recepção, o pedido de nome e vai direto para etapas condicionais.

**Why it happens:**
O LLM interpreta a primeira mensagem do lead em conjunto com o prompt, e se uma condição do prompt casa com o conteúdo dessa mensagem, tende a executar essa ramificação imediatamente. O conflito inicial é um comportamento documentado da LiderHub e diferente de alucinação — é uma falha de sequenciamento, não de invenção de fatos.

**How to avoid:**
- Todo prompt gerado deve conter na seção de recepção a instrução explícita: "Sempre inicie por aqui independentemente do conteúdo inicial da mensagem do usuário/cliente." (exatamente como está no Agente 1 de referência).
- Perguntas condicionais devem ser amarradas: "Prossiga para esta etapa somente se o lead já respondeu às perguntas anteriores."
- O meta-agente deve verificar que o prompt gerado inclui essas âncoras de ordenamento antes de entregar.
- No modo MELHORAR, ao diagnosticar conversas onde o bot pulou etapas, identificar se a causa é conflito inicial (primeira mensagem rica demais) e recomendar a âncora de ordenamento + revisão da mensagem de entrada da campanha.

**Warning signs:**
- Conversas reais onde o lead enviou uma primeira mensagem longa com múltiplos dados e o bot respondeu pulando o pedido de nome.
- Prompt gerado tem condicionais (ex.: "se o lead mencionou acidente...") sem estar ancorado a um gate de sequência obrigatória.
- Em testes, ao iniciar com uma mensagem que inclui dados do meio do funil, o bot não pede o nome e não executa a recepção.

**Phase to address:**
Fase de construção dos dois modos — é uma invariante de segurança do gerador de prompts. Deve constar no conjunto de regras LiderHub embutidas no agente.

---

### Pitfall 4: Alucinação jurídica — critérios de tese incorretos ou desatualizados no modo CRIAR

**What goes wrong:**
O modo CRIAR gera critérios de elegibilidade para uma tese jurídica (ex.: auxílio-acidente: "exige afastamento superior a 15 dias", ou trabalhista: "prazo prescricional de 2 anos") com base no conhecimento interno do modelo, sem verificação contra fontes atualizadas. No direito previdenciário e trabalhista brasileiro, legislação e jurisprudência mudam com frequência — reforma trabalhista, alterações no INSS, teses do STJ/TRT. Um prompt com critério errado qualifica leads inelegíveis ou descarta leads válidos, causando dano direto ao escritório.

**Why it happens:**
O conhecimento de treinamento do LLM tem cutoff e é genérico, não especializado no escritório. Sem um documento validado do operador como fonte primária, o modo CRIAR recorrerá ao treinamento. Pesquisa web traz risco de retornar legislação revogada ou artigos de blog com erros.

**How to avoid:**
- Hierarquia obrigatória de fontes: (1) documento de tese validado pelo operador (quando fornecido) tem prioridade absoluta; (2) pesquisa web apenas para complementar, com data de publicação verificada; (3) conhecimento do modelo como último recurso, sempre marcado com aviso de "validar com o advogado".
- O meta-agente deve emitir uma seção "VALIDAÇÃO JURÍDICA NECESSÁRIA" para todo critério que não veio de documento validado, listando explicitamente os critérios gerados e pedindo confirmação do operador antes de ativar o agente.
- Pesquisa web de legislação deve sempre incluir verificação de vigência (lei revogada? alterada por MP? súmula superada?).
- O agente gerado para o lead não deve afirmar direito a benefício — deve dizer que vai analisar, não que o lead tem ou não tem direito (responsabilidade jurídica).

**Warning signs:**
- Critério gerado sem referência a uma fonte específica.
- Divergência entre o critério gerado e o Agente 1 de referência (ex.: critério de auxílio-doença difere do que está no funil aux-acidente existente).
- Pesquisa web retorna artigos com mais de 1 ano sobre temas como INSS ou CLT sem verificação de vigência.

**Phase to address:**
Fase de construção do modo CRIAR — antes de qualquer uso em produção. O documento de tese do operador deve ser a entrada obrigatória na v1 do campo de prova.

---

### Pitfall 5: Overfitting em conversas escassas — diagnóstico enviesado no modo MELHORAR

**What goes wrong:**
O modo MELHORAR recebe 2-5 conversas de WhatsApp e diagnostica um "padrão de perda" que na realidade é ruído amostral ou viés de seleção. Exemplo: todas as conversas disponíveis são de leads que chegaram com acidente de 2002+ (como Valmir), logo o agente recomenda otimizar o fluxo de casos antigos — mas o padrão real de drop-off pode estar em outro ponto do funil, invisível nessa amostra.

**Why it happens:**
Conversas de WhatsApp são difíceis de exportar em volume. O operador tende a compartilhar as conversas mais problemáticas ou mais recentes, não uma amostra representativa. O meta-agente sem instrução explícita fará diagnósticos sobre o que está visível, não sobre o que é estatisticamente significativo.

**How to avoid:**
- Exigir mínimo de conversas por diagnóstico (sugestão: 10+ conversas, cobrindo leads qualificados e desqualificados).
- Reportar explicitamente o tamanho da amostra e alertar quando for pequena: "Diagnóstico baseado em N conversas — padrões abaixo podem ser ruído amostral."
- Pedir ao operador que indique qual agente/etapa ele suspeita ser o gargalo, e confirmar ou refutar com as conversas, ao invés de descobrir "do zero" com amostra pequena.
- Diferenciar diagnóstico de ponto de travamento (onde o lead para de responder) de diagnóstico de causa (por quê parou).

**Warning signs:**
- Todas as conversas fornecidas terminam no mesmo ponto do funil por coincidência de perfil, não de problema.
- Diagnóstico recomenda mudança em agente que aparece em apenas 1-2 das conversas analisadas.
- Operador não consegue fornecer mais de 3-4 conversas para análise.

**Phase to address:**
Fase de construção do modo MELHORAR — os critérios de qualidade da amostra devem ser parte do protocolo de entrada da skill de diagnóstico.

---

### Pitfall 6: Formato de output incompatível com a LiderHub — prompt não pode ser colado direto

**What goes wrong:**
O meta-agente entrega o prompt revisado em markdown com explicações intercaladas, ou com os tokens JSON formatados com quebras de linha e indentação, ou com as menções `@agente` em formato texto plano ao invés do padrão da plataforma. O operador precisa reformatar antes de colar — trabalho manual que anula o valor da ferramenta e introduz erros.

**Why it happens:**
O comportamento padrão do Claude ao gerar respostas longas é intercalar explicações com o conteúdo, usar markdown e formatar JSON para legibilidade. Sem instrução explícita de output limpo, o formato será orientado à leitura, não à colagem direta.

**How to avoid:**
- O output do meta-agente deve ter seções claramente delimitadas: primeiro o bloco "PROMPT PRONTO PARA COLAR" (texto limpo, sem markdown explicativo, com tokens inline como estão nos prompts de referência), depois o bloco "NOTAS E CHECKLIST" (com explicações e ações necessárias).
- Os tokens JSON devem ser emitidos em linha única, sem indentação, exatamente como aparecem no Agente 1 de referência.
- Incluir um teste de colagem na v1: colar o output gerado num agente de teste na LiderHub e verificar que não há arrobas vermelhos e os tokens funcionam.
- A skill de output deve ter um exemplo de formato de referência hardcoded derivado do Agente 1 real.

**Warning signs:**
- Output contém blocos ````json ... ```` com os tokens formatados em múltiplas linhas.
- Output intercala "## Justificativa" dentro do corpo do prompt que seria colado.
- Menções aparecem como `@03 - Sequelas` em texto plano ao invés do formato de menção da plataforma.

**Phase to address:**
Fase de construção de ambos os modos — o template de output é pré-requisito antes do primeiro teste de campo.

---

### Pitfall 7: Exposição de PII de leads (CPF, nome, dados de saúde) — risco LGPD

**What goes wrong:**
As conversas de WhatsApp exportadas como input do modo MELHORAR contêm CPF, nome completo, dados de saúde (tipo de acidente, sequelas, doenças) e às vezes dados bancários. O meta-agente processa esses dados no contexto do Claude (API Anthropic). Dados de leads que são pessoas físicas identificáveis, incluindo dados de saúde, são dados sensíveis sob a LGPD — e o escritório não necessariamente tem base legal para compartilhá-los com uma API externa para fins de otimização de sistema.

**Why it happens:**
A exportação de conversa do WhatsApp/LiderHub é "tudo ou nada" — não há campo a campo. O operador fornece o arquivo completo sem anonimizar. O Valmir.txt já demonstra: primeira linha do lead contém nome, data do acidente, profissão e natureza da sequela.

**How to avoid:**
- Antes de processar conversas para diagnóstico, a skill deve identificar e mascarar automaticamente: CPF (padrão `\d{3}\.\d{3}\.\d{3}-\d{2}` ou 11 dígitos consecutivos), nome completo (quando explicitamente identificado pelo lead), e — idealmente — substituir nomes por "Lead A", "Lead B".
- Instrução explícita no agente: "Não reproduza dados pessoais identificáveis do lead no output de diagnóstico. Use pseudônimos."
- Documentar no README do plugin que conversas devem ser anonimizadas antes de ingestão, ou usar a skill de mascaramento automático.
- Dados de saúde (tipo de acidente, sequela, doença) podem ser mantidos de forma agregada ("lead com sequela no joelho") mas não vinculados ao nome/CPF.

**Warning signs:**
- Arquivo de conversa input contém string `CPF:` ou padrão numérico de 11 dígitos.
- Output de diagnóstico menciona "Valmir disse que..." com dados pessoais identificáveis.
- Mais de uma conversa no input tem o mesmo nome de lead (risco de cruzamento de dados).

**Phase to address:**
Fase de construção do modo MELHORAR — o mascaramento de PII deve ser o primeiro passo do pipeline de ingestão, antes de qualquer análise.

---

### Pitfall 8: Wiring incorreto de skills/agentes no plugin Claude Code — skill invocada no contexto errado

**What goes wrong:**
O plugin tem múltiplas skills (ex.: `diagnosticar-funil`, `gerar-prompt-criar`, `gerar-prompt-melhorar`, `validar-tokens`). Se o wiring do agente principal não direciona corretamente o modo operacional para a skill certa, o agente pode chamar a skill de diagnóstico quando deveria gerar prompt, ou passar o contexto incompleto para a skill (ex.: chamar `gerar-prompt-melhorar` sem passar os prompts de referência existentes, fazendo a skill gerar tokens do zero ao invés de reutilizar).

**Why it happens:**
No triagem-previdenciaria de referência, o agente `triador` chama skills de suporte. O erro clássico é: o agente principal faz a análise inteiro sozinho em vez de delegar para skills especializadas, ou delega mas não passa o contexto necessário no `input` da skill.

**How to avoid:**
- Definir explicitamente no AGENTS.md do plugin quais dados cada skill espera receber como input e o que retorna como output.
- A skill `gerar-prompt-melhorar` deve receber obrigatoriamente: (a) conversas de input, (b) prompts de referência existentes com UUIDs, (c) diagnóstico da skill anterior. Sem (b) e (c), deve recusar e pedir os dados faltantes.
- Testar o pipeline completo ponta-a-ponta (input de conversa → diagnóstico → prompt revisado) antes de declarar o modo MELHORAR funcional.

**Warning signs:**
- Output do modo MELHORAR contém UUIDs diferentes dos que estão nos prompts de referência fornecidos.
- Agente principal faz tudo numa única resposta longa sem invocar skills — sinal de que o wiring está ignorado.
- Skill retorna erro de "input incompleto" durante desenvolvimento.

**Phase to address:**
Fase de estruturação do plugin (antes da implementação das skills individuais) — o contrato de input/output de cada skill deve ser definido antes de codificar.

---

### Pitfall 9: Contexto bloqueado por volume — conversas longas esgotam a janela de contexto do agente

**What goes wrong:**
O modo MELHORAR ingere 10+ conversas de WhatsApp + 8 prompts de referência (Agentes 1-8) + instruções do meta-agente. O volume total excede facilmente 50k-100k tokens. Em modelos com janela menor ou em invocações subsequentes dentro da mesma sessão Claude Code, o contexto trunca silenciosamente — o agente perde parte dos prompts de referência ou das conversas, e gera diagnósticos ou prompts baseados em contexto incompleto sem avisar.

**Why it happens:**
O Claude Code não emite erro explícito quando o contexto está cheio — ele simplesmente não "vê" o que ficou fora da janela. O operador não tem visibilidade desse truncamento.

**How to avoid:**
- Processar conversas em batches, não todas de uma vez. Diagnóstico por agente do funil (ex.: "analise as conversas onde o drop ocorreu no Agente 3") ao invés de diagnóstico global de tudo ao mesmo tempo.
- Incluir apenas os prompts de referência relevantes para o agente sendo revisado, não todos os 8 de uma vez.
- Documentar no plugin a estimativa de tokens por componente e o limite recomendado de conversas por invocação.
- No modo CRIAR, gerar um agente por vez com os prompts adjacentes (N-1 e N+1) como contexto, não toda a cadeia.

**Warning signs:**
- Diagnóstico não menciona eventos que claramente estão nas conversas fornecidas.
- Prompt gerado para o Agente 5 não tem consistência com os critérios dos Agentes 3-4 (perguntas que já foram respondidas aparecem de novo).
- Sessão Claude Code excede visivelmente 200k tokens no contexto da conversa.

**Phase to address:**
Fase de testes do campo de prova (v1 com aux-acidente) — o problema só se manifesta com dados reais em volume. Definir a estratégia de batching antes do primeiro teste com todas as 8 conversas + 8 prompts.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcodar os 8 UUIDs do funil aux-acidente direto no agente | Funciona imediatamente para o campo de prova | Quebra ao adicionar nova tese; operador tem que atualizar código | Nunca — usar sistema de placeholder + checklist desde o início |
| Gerar prompt sem seção de validação jurídica | Entrega mais rápida | Critérios errados entram em produção sem revisão do advogado | Nunca para teses novas; apenas se doc validado 100% fornecido |
| Processar conversas sem mascaramento de PII | Simplifica o pipeline | Risco LGPD; dados de leads em histórico de API | Nunca — mascaramento é pré-requisito |
| Gerar cada agente isoladamente sem contexto da cadeia | Mais simples de implementar | Sobreposição de prompt ausente; transferências quebradas | Nunca para a cadeia multi-agente |
| Usar conversas sem verificar tamanho da amostra | Diagnóstico imediato | Recomendações baseadas em ruído amostral viram prompts em produção | MVP: aceitar amostra pequena mas emitir aviso explícito de baixa confiança |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| LiderHub — tokens JSON | Formatar JSON com indentação para legibilidade | Emitir tokens em linha única sem quebras — a plataforma espera texto inline |
| LiderHub — menções `@` | Escrever `@Agente 3` como texto plano | Usar o formato de menção exato da plataforma; ao gerar novo agente usar placeholder `<MENCAO:NomeAgente>` com instrução de substituição |
| LiderHub — tokens `uuid` | Inventar ou copiar UUIDs de outro workspace | Extrair dos prompts de referência (modo MELHORAR) ou usar placeholder marcado (modo CRIAR) |
| WhatsApp export (input) | Assumir formato consistente | Formato varia: hora primeiro, nome depois, ou vice-versa; áudios aparecem como `[áudio]`; o parser deve ser tolerante e tratar inputs messy como o Valmir.txt |
| Claude API (contexto) | Enviar todo o material de uma vez | Segmentar por agente do funil; estimar tokens antes de submeter |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Ingestão de todas as conversas + todos os prompts de uma vez | Contexto truncado silenciosamente; diagnóstico incompleto | Processar em batches por agente do funil | Com 10+ conversas longas + 8 prompts de referência (~80k+ tokens) |
| Pesquisa web para legislação em tempo real durante CRIAR | Latência alta; resultado inconsistente entre execuções | Usar documento de tese validado como fonte primária; web apenas para verificar vigência | Sempre que a pesquisa retornar múltiplos resultados contraditórios |
| Validação de tokens via scan de texto | Falso negativo: placeholder marcado como UUID real | Usar regex específico para detectar UUIDs vs placeholders marcados | Quando o formato de placeholder não for padronizado desde o início |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Passar CPF/nome do lead para a API Claude sem mascaramento | Violação LGPD — dado pessoal sensível (saúde) enviado a terceiro sem base legal adequada | Mascaramento automático de CPF e nomes antes de qualquer chamada à API |
| Armazenar conversas de leads no histórico do plugin sem controle | Acúmulo de PII em arquivos locais acessíveis | Definir política de retenção: arquivos de conversa são temporários, apagados após geração do diagnóstico |
| Incluir critérios jurídicos do escritório (estratégia de qualificação) em outputs publicáveis | Exposição da estratégia comercial do escritório | Os prompts gerados são para uso interno do operador — documentar que não devem ser compartilhados externamente |
| Logs de debug incluindo conteúdo das conversas | PII em logs | Logar apenas metadados (número de conversas, agente analisado, tokens estimados), nunca conteúdo |

---

## UX Pitfalls

| Pitfall | User Impact (operador) | Better Approach |
|---------|----------------------|-----------------|
| Entregar diagnóstico sem indicar o agente específico do funil | Operador não sabe onde colar a correção | Diagnóstico sempre referencia o agente pelo número e nome (ex.: "Agente 3 — Sequelas") |
| Checklist de setup sem ordem de criação na LiderHub | Operador cria recursos na ordem errada (status antes de agente) e gera erros | Checklist ordenada: 1. Status, 2. Etiquetas, 3. Agentes (responsáveis), 4. Mensagens/vídeos, 5. Integrações |
| Prompt gerado sem delimitadores claros do "bloco para colar" | Operador cola com as explicações do meta-agente dentro | Usar delimitadores visuais explícitos: `=== INÍCIO DO PROMPT — COPIE A PARTIR DAQUI ===` e `=== FIM DO PROMPT ===` |
| Modo MELHORAR entrega só diagnóstico sem o prompt revisado | Operador tem que escrever a correção manualmente | Diagnóstico e prompt revisado sempre juntos no mesmo output |
| Placeholder de UUID sem instrução de onde obter o valor real | Operador não sabe como encontrar o UUID na LiderHub | Checklist inclui: "Para obter o UUID do status X: Configurações → Status → copiar ID" |

---

## "Looks Done But Isn't" Checklist

- [ ] **Modo CRIAR:** Verificar que nenhum token `"uuid"` contém um valor hexadecimal não-placeholder — todo UUID novo deve estar no formato `<UUID:tipo:nome>`.
- [ ] **Modo MELHORAR:** Verificar que todos os UUIDs do output correspondem a UUIDs dos prompts de referência fornecidos como input — nenhum UUID novo foi introduzido.
- [ ] **Sobreposição de prompt:** Verificar que toda instrução de transferência (`{"type":"responsavel",...}`) está acompanhada de uma mensagem literal para o lead no mesmo bloco.
- [ ] **Conflito inicial:** Verificar que a seção de recepção de cada prompt gerado contém âncora explícita de ordenamento ("Sempre inicie por aqui independentemente...").
- [ ] **PII mascarado:** Verificar que o output de diagnóstico não contém CPF, nome completo de lead, ou informação de saúde vinculada a um indivíduo identificável.
- [ ] **Formato colável:** Verificar que o bloco "PROMPT PARA COLAR" não contém markdown explicativo, blocos de código com indentação ou títulos de seção.
- [ ] **Critérios jurídicos:** Verificar que toda afirmação de critério de elegibilidade tem fonte identificada (documento do operador, lei com número, ou aviso "validar com advogado").
- [ ] **Checklist de setup:** Verificar que toda tese nova tem checklist completo com os recursos a criar na LiderHub antes de ativar.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| UUID fabricado colado na LiderHub | MEDIUM | Identificar token quebrado (arroba vermelho na plataforma), localizar o UUID correto em Configurações, substituir no prompt, retestar com `/restart` |
| Sobreposição ausente descoberta em produção | LOW | Editar o prompt do agente anterior, adicionar a primeira pergunta do próximo agente antes do token de transferência, retestar |
| Critério jurídico incorreto em agente ativo | HIGH | Pausar o agente imediatamente, revisar com o advogado, corrigir prompt e base de conhecimento, auditar conversas desde a ativação para identificar leads mal qualificados/desqualificados |
| PII de lead processado sem mascaramento | HIGH | Não há rollback técnico (dado já foi enviado à API); documentar o incidente, implementar mascaramento retroativamente, avaliar necessidade de notificação LGPD |
| Conflito inicial causando pulo de etapas em produção | LOW | Adicionar âncora de ordenamento no prompt, revisar mensagem de entrada da campanha que pode estar induzindo o conflito, retestar com mesma primeira mensagem |
| Diagnóstico baseado em amostra pequena levou a mudança de prompt que piorou resultado | MEDIUM | Reverter para prompt anterior (manter versão anterior sempre), coletar amostra maior antes de nova iteração |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| UUIDs fabricados | Fase 1 — Estrutura do plugin e template de output | Scan automático de output: nenhum UUID hexadecimal não-placeholder |
| Sobreposição ausente | Fase 1 — Gerador de prompt (ambos os modos) | Testar transferência no funil aux-acidente com `/restart` |
| Conflito inicial não tratado | Fase 1 — Template de prompt base | Testar com primeira mensagem rica (igual Valmir.txt) |
| Alucinação jurídica | Fase 2 — Modo CRIAR (campo de prova tese nova) | Checklist de validação jurídica com o advogado antes de ativar |
| Overfitting em amostras pequenas | Fase 2 — Modo MELHORAR (campo de prova aux-acidente) | Output inclui N da amostra e aviso de confiança |
| Formato incompatível | Fase 1 — Template de output | Colar output em agente de teste LiderHub sem nenhuma edição manual |
| Exposição de PII | Fase 1 — Pipeline de ingestão do modo MELHORAR | Input mascarado antes de qualquer análise; verificar com grep de CPF no output |
| Wiring incorreto de skills | Fase 1 — Estrutura do plugin | Teste ponta-a-ponta: input → skill diagnóstico → skill gerador → output |
| Contexto bloqueado por volume | Fase 2 — Testes com dados reais | Testar com 8 conversas + 8 prompts simultâneos e verificar cobertura |

---

## Sources

- Manual Doc Liderhub.md — seções "Alucinação de Prompt", "Conflito inicial", "Sobreposição de Prompt", "O que é um Prompt?" (leitura direta; HIGH confidence)
- Agente 1 - Aux.md — prompt real do funil aux-acidente com UUIDs e tokens reais do workspace (leitura direta; HIGH confidence para estrutura de tokens e sobreposição)
- Valmir.txt — conversa real exportada do WhatsApp/LiderHub demonstrando PII exposta e input messy (leitura direta; HIGH confidence para LGPD e conflito inicial)
- PROJECT.md — escopo, constraints e decisões do projeto (leitura direta; HIGH confidence)
- Lei 13.709/2018 (LGPD) — proteção de dados pessoais sensíveis (conhecimento de treinamento; HIGH confidence para classificação de dados de saúde como sensíveis)

---
*Pitfalls research for: Meta-agente LiderHub — gerador/otimizador de prompts jurídicos*
*Researched: 2026-06-08*
