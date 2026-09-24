import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Configuration constants
const COMPANY_CONFIG = {
  name: "Industrial de Alimentos E. YL., S.A. de C.V",
  shortName: "INSUMOS E. Y L.",
  rtn: "08019007088535",
  cai: "9ACDC8-FC347E-7B43B8-7790B8-3E2429-99",
  address: "San Pedro Sula, Carretera El Carmen",
  caiRange: "001-002-01-00062371 al 001-002-01-00072370",
  emissionLimit: "15/12/2023"
};

/**
 * Formats a date into Honduran DD/MM/YYYY format
 * @param {string|Date} dateInput
 * @returns {string}
 */
function formatDateDMY(dateInput) {
  if (!dateInput || dateInput === "—") return "—";
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, "0");
      const d = isoMatch[3].padStart(2, "0");
      return `${d}/${m}/${y}`;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const LAYOUT = {
  margin: 14,
  pageWidth: 210,
  headerHeight: 60,
  tableMargin: 80,
  rightAlignX: 155
};

const STYLES = {
  headerFontSize: 24,
  subHeaderFontSize: 10.8, // 20% más grande que la información de abajo (9 * 1.2)
  normalFontSize: 12,
  smallFontSize: 9,
  primaryColor: [31, 23, 23], // RGB for header
  currency: 'Lps.'
};

const TEXTS = {
  invoice: 'Factura',
  original: 'Factura Original',
  client: 'Cliente',
  total: 'Total',
  issuedDate: 'Fecha emitida',
  emissionLimit: 'Fecha Limite de Emision',
  authorizedRange: 'Autorizado del',
  discountRebates: 'Desc. Y Reb Otorgados',
  exoneratedAmount: 'Importe Exonerado',
  exemptAmount: 'Importe Exento',
  taxable15: 'Importe Grabado 15%',
  taxable18: 'Importe Grabado 18%',
  tax15: 'Impuesto 15%',
  tax18: 'Impuesto 18%',
  amount: 'Son'
};

/**
 * Validates the input parameters for PDF generation
 * @param {Object} params - Invoice parameters
 * @throws {Error} If validation fails
 */
function validateParams(params) {
  const required = ['Numero', 'Fecha', 'Cliente', 'totalFactura', 'cart', 'cantidades', 'subTotal', 'base15', 'isv15', 'base18', 'isv18', 'totalWords', 'condicion', 'formapago'];

  for (const field of required) {
    if (params[field] === undefined || params[field] === null) {
      throw new Error(`Missing required parameter: ${field}`);
    }
  }

  if (!Array.isArray(params.cart)) {
    throw new Error('Cart must be an array');
  }

  if (params.cart.length === 0) {
    throw new Error('Cart cannot be empty');
  }

  // Validate cart items
  for (const item of params.cart) {
    if (!item.Nombre || typeof item.Cantidad !== 'number' || typeof item.Precio !== 'number') {
      throw new Error('Invalid cart item structure');
    }
  }
}

/**
 * Adds the company header to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Object} invoiceData - Invoice data
 */
function addHeader(doc, invoiceData) {
  doc.setFontSize(STYLES.headerFontSize);
  doc.text(COMPANY_CONFIG.name, LAYOUT.margin, 17);

  doc.setFontSize(STYLES.subHeaderFontSize);
  doc.text(`${TEXTS.invoice} 000-000-00-${invoiceData.Numero}`, LAYOUT.margin, 33);
  doc.text(COMPANY_CONFIG.address, 100, 33);

  doc.setFontSize(STYLES.smallFontSize);
  doc.text(`RTN: ${COMPANY_CONFIG.rtn}`, LAYOUT.margin, 40);
  doc.text(`CAI: ${COMPANY_CONFIG.cai}`, LAYOUT.margin, 45);
  doc.text(TEXTS.original, 100, 40);
  doc.text(`${TEXTS.issuedDate}: ${formatDateDMY(invoiceData.Fecha)}`, 100, 45);
  doc.text(`${TEXTS.authorizedRange}: ${COMPANY_CONFIG.caiRange}`, 100, 50);
  doc.text(`${TEXTS.emissionLimit}: ${formatDateDMY(COMPANY_CONFIG.emissionLimit)}`, 100, 55);
}

/**
 * Adds client information to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Object} clientData - Client data
 * @returns {number} The Y position where client info ended
 */
function addClientInfo(doc, clientData) {
  let currentY = 50;
  doc.text(`${TEXTS.client}: ${clientData.Cliente}`, LAYOUT.margin, currentY);

  currentY += 5;
  doc.text(`RTN del cliente: ${clientData.cantidades?.rtnCliente || "—"}`, LAYOUT.margin, currentY);

  currentY += 5;
  if (clientData.condicion === "Credito") {
    doc.text(
      `Condicion: Credito (${clientData.dias_credito || 30} dias)  |  Vence: ${formatDateDMY(clientData.fecha_vencimiento)}`,
      LAYOUT.margin,
      currentY
    );
  } else {
    doc.text(
      `Condicion: ${clientData.condicion}  |  Forma de pago: ${clientData.formapago || "—"}`,
      LAYOUT.margin,
      currentY
    );
  }

  const detalle = (clientData.detalle || "").trim();
  if (detalle && detalle !== "—") {
    currentY += 5;
    doc.text(`Detalle: ${detalle}`, LAYOUT.margin, currentY);
  }

  const observacion = (clientData.observacion || "").trim();
  if (observacion && observacion !== "—") {
    currentY += 5;
    doc.text(`Observacion: ${observacion}`, LAYOUT.margin, currentY);
  }

  return currentY;
}

/**
 * Adds the items table to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Array} cart - Cart items
 * @param {number} [startY] - Vertical starting position
 */
function addItemsTable(doc, cart, startY = LAYOUT.tableMargin) {
  const columns = ["Producto", "Cantidad", "Precio", "Total"];

  doc.autoTable({
    head: [columns],
    body: cart.map((item) => {
      let suffix = "";
      if (item.tipoImpuesto === "exonerado" || item.exonerado) {
        suffix = " (EX)";
      } else if (item.tipoImpuesto === "exento" || item.exento) {
        suffix = " (E)";
      } else if (item.tipoImpuesto === "18") {
        suffix = " (18%)";
      }
      return [
        `${item.Nombre}${suffix}`,
        item.Cantidad,
        Number(item.Precio || 0).toFixed(2),
        `${(Number(item.Precio || 0) * Number(item.Cantidad || 0)).toFixed(2)} Lps.`,
      ];
    }),
    theme: "plain",
    headStyles: {
      fillColor: STYLES.primaryColor,
      textColor: "white",
      fontSize: STYLES.normalFontSize
    },
    startY: startY,
    margin: { top: startY },
    tableWidth: "auto",
    styles: { fontSize: STYLES.smallFontSize }
  });
}

/**
 * Adds the totals and tax information to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Object} totals - Total amounts
 */
function addTotalsSection(doc, totals) {
  const startY = doc.autoTable.previous.finalY + 10;
  doc.setFontSize(STYLES.normalFontSize);

  const formatAmount = (val) => {
    const num = Number(val) || 0;
    return num.toFixed(2);
  };

  const lines = [
    { label: TEXTS.discountRebates, value: totals.cantidades.cantidadDescuento },
    { label: TEXTS.exoneratedAmount, value: totals.cantidades.cantidadExonerado },
    { label: TEXTS.exemptAmount, value: totals.cantidades.cantidadExento },
    { label: TEXTS.taxable15, value: totals.base15 },
    { label: TEXTS.taxable18, value: totals.base18 },
    { label: TEXTS.tax15, value: totals.isv15 },
    { label: TEXTS.tax18, value: totals.isv18 },
    { label: TEXTS.total, value: totals.totalFactura }
  ];

  lines.forEach((line, index) => {
    const y = startY + (index * 7);
    doc.text(`${line.label}:`, LAYOUT.margin, y);
    doc.text(`${formatAmount(line.value)}`, LAYOUT.rightAlignX, y);
  });

  doc.text(`${TEXTS.amount}: ${totals.totalWords}`, LAYOUT.margin, startY + (lines.length * 7) + 6);
}

/**
 * Generates a PDF invoice
 * @param {Object} params - Invoice parameters
 * @param {string} params.Numero - Invoice number
 * @param {string} params.Fecha - Issue date
 * @param {string} params.Cliente - Client name
 * @param {number} params.totalFactura - Total invoice amount
 * @param {Array} params.cart - Array of cart items
 * @param {Object} params.cantidades - Tax and discount amounts
 * @param {number} params.subTotal - Subtotal amount
 * @param {number} params.base15 - 15% taxable amount
 * @param {number} params.isv15 - 15% tax amount
 * @param {number} params.base18 - 18% taxable amount
 * @param {number} params.isv18 - 18% tax amount
 * @param {string} params.totalWords - Total amount in words
 * @param {string} params.condicion - Payment condition (Contado/Credito)
 * @param {string} params.formapago - Payment method (Efectivo/Transferencia)
 * @param {string} params.detalle - Payment detail
 * @param {string} params.observacion - Invoice observation
 * @param {Object} options - Generation options
 * @param {string} options.fileName - Custom file name (default: factura-{Numero}.pdf)
 * @param {boolean} options.autoDownload - Whether to auto-download (default: true)
 * @param {boolean} options.returnBlob - Whether to return blob instead of saving (default: false)
 * @returns {jsPDF|Blob} The PDF document or blob
 * @throws {Error} If validation fails or generation encounters an error
 */
export default function sendPdf(params, options = {}) {
  try {
    // Validate input parameters
    validateParams(params);

    const {
      fileName = `factura-${params.Numero}.pdf`,
      autoDownload = true,
      autoOpen = true,
      targetWindow = null,
      returnBlob = false
    } = options;

    // Create PDF document
    const doc = new jsPDF();

    // Add sections
    addHeader(doc, params);
    const clientInfoEndY = addClientInfo(doc, params);
    const tableStartY = Math.max(clientInfoEndY + 8, 68);
    addItemsTable(doc, params.cart, tableStartY);
    addTotalsSection(doc, params);

    // Handle output options
    if (returnBlob) {
      return doc.output('blob');
    }

    if (autoOpen) {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      if (targetWindow && !targetWindow.closed) {
        targetWindow.location.href = blobUrl;
      } else {
        window.open(blobUrl, '_blank');
      }
    }

    if (autoDownload) {
      doc.save(fileName);
    }

    return doc;

  } catch (error) {
    console.error('PDF generation failed:', error);
    throw new Error(`Failed to generate PDF invoice: ${error.message}`);
  }
}

