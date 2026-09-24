import XLSX from "xlsx-js-style";

/**
 * Paleta y estilos base para la exportación de Excel
 */
const STYLES = {
  header: {
    font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1E293B" } }, // Slate 800 corporativo elegante
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "334155" } },
      bottom: { style: "medium", color: { rgb: "0F172A" } },
      left: { style: "thin", color: { rgb: "334155" } },
      right: { style: "thin", color: { rgb: "334155" } },
    },
  },
  cellText: (isAltRow) => ({
    font: { name: "Segoe UI", sz: 10, color: { rgb: "1E293B" } },
    fill: isAltRow ? { fgColor: { rgb: "F8FAFC" } } : { fgColor: { rgb: "FFFFFF" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } },
    },
  }),
  cellCenter: (isAltRow) => ({
    font: { name: "Segoe UI", sz: 10, color: { rgb: "1E293B" } },
    fill: isAltRow ? { fgColor: { rgb: "F8FAFC" } } : { fgColor: { rgb: "FFFFFF" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } },
    },
  }),
  cellNumber: (isAltRow, numFmt = "#,##0.00") => ({
    font: { name: "Segoe UI", sz: 10, color: { rgb: "1E293B" } },
    fill: isAltRow ? { fgColor: { rgb: "F8FAFC" } } : { fgColor: { rgb: "FFFFFF" } },
    alignment: { horizontal: "right", vertical: "center" },
    numFmt,
    border: {
      top: { style: "thin", color: { rgb: "E2E8F0" } },
      bottom: { style: "thin", color: { rgb: "E2E8F0" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } },
    },
  }),
  totalLabel: {
    font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "0F172A" } },
    fill: { fgColor: { rgb: "F1F5F9" } },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "0F172A" } },
      bottom: { style: "double", color: { rgb: "0F172A" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } },
    },
  },
  totalNumber: (numFmt = "#,##0.00") => ({
    font: { name: "Segoe UI", sz: 10, bold: true, color: { rgb: "0F172A" } },
    fill: { fgColor: { rgb: "F1F5F9" } },
    alignment: { horizontal: "right", vertical: "center" },
    numFmt,
    border: {
      top: { style: "thin", color: { rgb: "0F172A" } },
      bottom: { style: "double", color: { rgb: "0F172A" } },
      left: { style: "thin", color: { rgb: "E2E8F0" } },
      right: { style: "thin", color: { rgb: "E2E8F0" } },
    },
  }),
};

/**
 * Exporta un conjunto de datos a un archivo Excel con estilos profesionales.
 *
 * @param {Object} options
 * @param {string} options.fileName - Nombre del archivo de salida (ej. "reporte_ventas.xlsx")
 * @param {string} [options.sheetName="Datos"] - Nombre de la pestaña
 * @param {Array<{key: string, header: string, align?: 'left'|'center'|'right', numFmt?: string, isTotal?: boolean, width?: number}>} options.columns
 * @param {Array<Object>} options.data - Registros a exportar
 * @param {boolean} [options.includeTotals=false] - Si se debe agregar una fila final con sumatorias
 */
export function exportStyledExcel({
  fileName = "export.xlsx",
  sheetName = "Datos",
  columns,
  data = [],
  includeTotals = false,
}) {
  // 1. Extraer encabezados y filas
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.key];
      if (val === undefined || val === null) return "";
      return val;
    })
  );

  const sheetData = [headers, ...rows];

  // 2. Fila de totales opcional
  if (includeTotals && data.length > 0) {
    const totalRow = columns.map((col, idx) => {
      if (idx === 0) return "TOTALES";
      if (col.isTotal) {
        return data.reduce((sum, item) => sum + (Number(item[col.key]) || 0), 0);
      }
      return "";
    });
    sheetData.push(totalRow);
  }

  // 3. Crear hoja de cálculo
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // 4. Configurar alturas de fila
  const rowHeights = [{ hpt: 26 }]; // Encabezado
  for (let i = 0; i < rows.length; i++) {
    rowHeights.push({ hpt: 20 }); // Filas de datos
  }
  if (includeTotals && data.length > 0) {
    rowHeights.push({ hpt: 22 }); // Fila de totales
  }
  ws["!rows"] = rowHeights;

  // 5. Configurar anchos de columna dinámicos
  ws["!cols"] = columns.map((col) => {
    if (col.width) return { wch: col.width };
    let maxLen = col.header.length;
    data.forEach((item) => {
      const val = item[col.key];
      if (val !== undefined && val !== null) {
        const strVal = typeof val === "number" ? val.toFixed(2) : String(val);
        if (strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });

  // 6. Activar autofiltro para el encabezado
  const lastColLetter = XLSX.utils.encode_col(columns.length - 1);
  const dataEndRow = rows.length + 1; // 1-based
  ws["!autofilter"] = { ref: `A1:${lastColLetter}${dataEndRow}` };

  // 7. Aplicar estilos a las celdas
  // 7.1 Encabezados (fila 0)
  columns.forEach((_, cIdx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: cIdx });
    if (ws[cellAddr]) {
      ws[cellAddr].s = STYLES.header;
    }
  });

  // 7.2 Filas de datos
  rows.forEach((_, rIdx) => {
    const sheetRowIdx = rIdx + 1;
    const isAlt = rIdx % 2 === 1;

    columns.forEach((col, cIdx) => {
      const cellAddr = XLSX.utils.encode_cell({ r: sheetRowIdx, c: cIdx });
      if (!ws[cellAddr]) return;

      const cellVal = ws[cellAddr].v;
      const isNumeric = typeof cellVal === "number" || col.numFmt;

      if (isNumeric) {
        ws[cellAddr].s = STYLES.cellNumber(isAlt, col.numFmt || "#,##0.00");
      } else if (col.align === "center") {
        ws[cellAddr].s = STYLES.cellCenter(isAlt);
      } else {
        ws[cellAddr].s = STYLES.cellText(isAlt);
      }
    });
  });

  // 7.3 Fila de totales (si aplica)
  if (includeTotals && data.length > 0) {
    const totalRowIdx = rows.length + 1;
    columns.forEach((col, cIdx) => {
      const cellAddr = XLSX.utils.encode_cell({ r: totalRowIdx, c: cIdx });
      if (!ws[cellAddr]) return;

      if (cIdx === 0) {
        ws[cellAddr].s = STYLES.totalLabel;
      } else if (col.isTotal) {
        ws[cellAddr].s = STYLES.totalNumber(col.numFmt || "#,##0.00");
      } else {
        ws[cellAddr].s = STYLES.totalLabel;
      }
    });
  }

  // 8. Crear libro y exportar
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const safeFileName = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, safeFileName);
}
