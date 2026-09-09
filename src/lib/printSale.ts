/**
 * Utilitário para impressão de cupom de venda (recibo térmico 80mm)
 * Gera uma janela de impressão dedicada com os dados da venda
 */

export interface PrintSaleReceiptData {
  numero: string | number;
  data: string;
  cliente: string;
  itens: Array<{
    descricao: string;
    quantidade: number;
    preco: number;
  }>;
  subtotal: number;
  desconto: number;
  total: number;
  pagamentos?: Array<{
    forma: string;
    valor: number;
  }>;
  empresa: {
    nome: string;
    documento: string;
  };
}

export const printSaleReceipt = (data: PrintSaleReceiptData): void => {
  const {
    numero,
    data: dataVenda,
    cliente,
    itens,
    subtotal,
    desconto,
    total,
    pagamentos,
    empresa,
  } = data;

  // Formatação de moeda
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Gerar conteúdo HTML do cupom
  const receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cupom de Venda #${numero}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 80mm;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .header h2 {
          margin: 0;
          font-size: 14px;
          font-weight: bold;
        }
        .header p {
          margin: 3px 0;
          font-size: 10px;
        }
        .info {
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        th, td {
          padding: 3px 0;
          font-size: 10px;
        }
        th {
          text-align: left;
          border-bottom: 1px solid #000;
        }
        .text-center {
          text-align: center;
        }
        .text-right {
          text-align: right;
        }
        .totals {
          border-top: 1px dashed #000;
          padding-top: 10px;
          margin-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .total-final {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #000;
          font-size: 16px;
          font-weight: bold;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .footer p {
          margin: 5px 0;
        }
        @media screen {
          body {
            background: #f5f5f5;
            border: 1px solid #ddd;
            margin: 20px auto;
          }
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${empresa.nome}</h2>
        <p>${empresa.documento || 'CNPJ: 00.000.000/0000-00'}</h2>
        <p>Cupom Fiscal #${numero}</p>
        <p>${new Date(dataVenda).toLocaleString('pt-BR')}</p>
      </div>

      <div class="info">
        <strong>Cliente:</strong> ${cliente}
      </div>

      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th class="text-center">Qtd</th>
            <th class="text-right">Unit.</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itens.map(item => `
            <tr>
              <td>${item.descricao}</td>
              <td class="text-center">${item.quantidade}</td>
              <td class="text-right">${formatCurrency(item.preco)}</td>
              <td class="text-right">${formatCurrency(item.preco * item.quantidade)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        ${desconto > 0 ? `
        <div class="total-row" style="color: red;">
          <span>Desconto (-):</span>
          <span>${formatCurrency(desconto)}</span>
        </div>
        ` : ''}
        ${pagamentos && pagamentos.length > 0 ? `
        <div style="margin-top: 10px; border-top: 1px solid #000; padding-top: 5px;">
          <strong>Pagamentos:</strong>
          ${pagamentos.map(p => `
            <div class="total-row">
              <span>${p.forma}:</span>
              <span>${formatCurrency(p.valor)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        <div class="total-final">
          <span>TOTAL:</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Obrigado pela preferência!</p>
        <p style="font-size: 10px;">PDV INTELIGENTE</p>
        <p style="font-size: 10px;">Copyright © 2026 All rights reserved.</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  // Abrir janela de impressão dedicada
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  } else {
    console.warn('Não foi possível abrir a janela de impressão. Pop-ups podem estar bloqueados.');
    // Fallback: imprimir na janela atual
    document.write(receiptContent);
    document.close();
  }
};
