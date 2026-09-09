import type { DataTableColumn } from '../types/navigation.types.js';

/**
 * Utility to extract clean text from column accessor or cell value
 */
function extractCellValue<T>(
  col: DataTableColumn<T>,
  row: T
): string {
  if (col.accessor) {
    const val = col.accessor(row);
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    // If it is a React element or object, fallback to row property or empty
    const rawVal = (row as Record<string, unknown>)[col.key];
    return rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
  }
  const rawVal = (row as Record<string, unknown>)[col.key];
  return rawVal !== null && rawVal !== undefined ? String(rawVal) : '';
}

/**
 * Escapes values for CSV format
 */
function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Export data to standard UTF-8 CSV with BOM
 */
export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  columns: DataTableColumn<T>[],
  data: T[]
): void {
  const headers = columns.map((col) => escapeCsvValue(col.header)).join(';');
  const rows = data.map((row) => {
    return columns
      .map((col) => escapeCsvValue(extractCellValue(col, row)))
      .join(';');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
}

/**
 * Export data to Microsoft Excel compatible Spreadsheet format (.xlsx / .xls)
 */
export function exportToExcel<T extends Record<string, unknown>>(
  filename: string,
  columns: DataTableColumn<T>[],
  data: T[]
): void {
  const headerXml = columns
    .map(
      (col) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`
    )
    .join('');

  const rowsXml = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const val = extractCellValue(col, row);
          const isNum = !isNaN(Number(val)) && val.trim() !== '';
          const type = isNum ? 'Number' : 'String';
          return `<Cell><Data ss:Type="${type}">${escapeXml(val)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Dados">
  <Table>
   <Row>${headerXml}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
  });
  triggerDownload(blob, `${filename}.xlsx`);
}

/**
 * Export data to a clean printable PDF / print window view
 */
export function exportToPdf<T extends Record<string, unknown>>(
  filename: string,
  title: string,
  columns: DataTableColumn<T>[],
  data: T[]
): void {
  const tableHeaders = columns
    .map((c) => `<th style="border: 1px solid #cbd5e1; padding: 8px 10px; background-color: #f1f5f9; text-align: left; font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${escapeXml(c.header)}</th>`)
    .join('');

  const tableRows = data.length > 0
    ? data
        .map((row) => {
          const cells = columns
            .map(
              (col) =>
                `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 11px; color: #334155;">${escapeXml(extractCellValue(col, row)) || '-'}</td>`
            )
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('')
    : `<tr><td colspan="${columns.length}" style="border: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: #64748b;">Não há registros cadastrados.</td></tr>`;

  const htmlDoc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title)} — OLYPS PRO</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 15px; color: #0f172a; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .subtitle { font-size: 12px; font-weight: 600; color: #475569; margin-top: 2px; }
    .meta { font-size: 10px; color: #64748b; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">OLYPS PRO &bull; Sistema Integrado de Gestão</div>
      <div class="subtitle">${escapeXml(title)}</div>
    </div>
    <div class="meta">
      <div>Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
      <div>Total de Registros: ${data.length}</div>
    </div>
  </div>
  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    <span>Documento gerado automaticamente pela plataforma OLYPS PRO.</span>
    <span>Página 1 de 1</span>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8;' });
  triggerDownload(blob, `${filename}.html`);
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
