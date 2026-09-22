/**
 * Inscrições da palestra — recebe os envios do formulário ramonantonio.adv.br/palestra/
 * e grava uma linha nesta planilha (Drive).
 *
 * COMO PUBLICAR (uma vez, na conta Google do escritório):
 *  1. Abra a planilha "Inscrições — Palestra (formulário do site)" no Drive.
 *  2. Menu Extensões → Apps Script. Apague o conteúdo e cole este arquivo inteiro. Salve (Ctrl+S).
 *  3. Botão azul "Implantar" → "Nova implantação" → engrenagem → tipo "App da Web".
 *     - Executar como: "Eu"          - Quem pode acessar: "Qualquer pessoa"
 *  4. "Implantar" → autorize o acesso (Avançado → Acessar o projeto) → copie a "URL do app da Web"
 *     (termina em /exec).
 *  5. No terminal: gh secret set PUBLIC_PALESTRA_SHEET_ENDPOINT -R doods-maker/ramonantonio-site
 *     e cole a URL. O próximo deploy do site passa a gravar aqui.
 *
 *  Para alterar o script depois: Implantar → Gerenciar implantações → editar → versão "Nova" → Implantar
 *  (a URL continua a mesma).
 */

var CABECALHO = ['Data/hora', 'Nome', 'Data de nascimento', 'E-mail', 'WhatsApp', 'Consentimento', 'Campanha', 'Origem (UTM)'];

function doPost(e) {
  try {
    var dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (dados.website) return responder({ ok: true }); // honeypot: bot, finge sucesso

    var nome = String(dados.nome || '').trim();
    var telefone = String(dados.telefone || '').trim();
    if (!nome || telefone.replace(/\D/g, '').length < 12) return responder({ ok: false, erro: 'dados' });

    var aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (aba.getLastRow() === 0) aba.appendRow(CABECALHO);
    aba.appendRow([
      new Date(),
      nome,
      String(dados.data_nascimento || ''),
      String(dados.email || '').trim(),
      telefone,
      String(dados.consent || 'Não'),
      String(dados.campanha || ''),
      String(dados.utm || '')
    ]);
    return responder({ ok: true });
  } catch (err) {
    return responder({ ok: false, erro: String(err) });
  }
}

// Abrir a URL /exec no navegador mostra este texto: serve para conferir que a implantação está no ar.
function doGet() {
  return ContentService.createTextOutput('Inscrições da palestra: endpoint ativo.');
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
