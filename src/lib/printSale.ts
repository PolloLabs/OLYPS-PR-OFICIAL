// src/lib/printSale.ts — Utilitário de impressão (zero impacto no sistema)

export interface SalePrintItem { descricao: string; quantidade: number; preco: number }
export interface SalePrintData {
  numero: string | number;
  data: string;
  cliente?: string;
  itens: SalePrintItem[];
  subtotal: number;
  desconto: number;
  total: number;
  pagamentos?: { forma: string; valor: number }[];
  empresa?: { nome?: string; documento?: string };
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number.isFinite(v) ? v : 0);

function buildReceiptHtml(s: SalePrintData): string {
  const itens = s.itens.map((i) => `
    <tr><td>${esc(i.descricao)}</td><td class="c">${i.quantidade}</td>
    <td class="r">${brl(i.preco)}</td><td class="r">${brl(i.quantidade * i.preco)}</td></tr>`).join('');
  const pags = (s.pagamentos ?? []).map((p) =>
    `<div class="row"><span>${esc(p.forma)}</span><b>${brl(p.valor)}</b></div>`).join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>Venda ${esc(s.numero)}</title>
<style>
  @page { margin: 10mm; }
  body { font: 12px/1.4 Arial, sans-serif; color:#000; margin:0; padding:8mm; }
  h1 { font-size:16px; margin:0 0 2px; }
  .sub { color:#444; margin:0 0 10px; }
  table { width:100%; border-collapse:collapse; margin:8px 0; }
  th,td { border-bottom:1px solid #ccc; padding:4px 6px; text-align:left; }
  th { background:#f2f2f2; }
  .c{text-align:center} .r{text-align:right}
  .tot { margin-left:auto; width:260px; }
  .tot .row { display:flex; justify-content:space-between; padding:3px 0; }
  .tot .row b { font-weight:bold; }
  .footer { margin-top:15px; font-size:11px; color:#666; text-align:center; }
  @media print { .no-print { display:none; } }
</style></head><body>
<h1>${esc(s.empresa?.nome ?? 'Venda')}</h1>
<div class="sub">Documento: ${esc(s.documento ?? '')} | Venda #${esc(s.numero)} | ${esc(s.data)}${s.cliente ? ` | Cliente: ${esc(s.cliente)}` : ''}</div>
<table><thead><tr><th>Descrição</th><th class="c">Qtd</th><th class="r">Preço</th><th class="r">Total</th></tr></thead>
<tbody>${itens}</tbody></table>
<div class="tot">
  <div class="row"><span>Subtotal</span><span>${brl(s.subtotal)}</span></div>
  <div class="row"><span>Desconto</span><span>-${brl(s.desconto)}</span></div>
  <div class="row"><b>Total</b><b>${brl(s.total)}</b></div>
</div>
${pags ? `<div style="margin-top:10px"><strong>Pagamentos:</strong>${pags}</div>` : ''}
<div class="footer">Obrigado pela preferência!</div>
</body></html>`;
}

export function printSale(data: SalePrintData): void {
  const html = buildReceiptHtml(data);
  const win = window.open('', '_blank');
  if (!win) {
    console.error('Não foi possível abrir a janela de impressão.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

export function downloadSalePdf(data: SalePrintData, filename?: string): void {
  const html = buildReceiptHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `venda-${data.numero}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
