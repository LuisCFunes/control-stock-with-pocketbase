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
  emissionLimit: "2023-12-15"
};

const LAYOUT = {
  margin: 14,
  pageWidth: 210,
  headerHeight: 60,
  tableMargin: 65,
  rightAlignX: 155
};

const STYLES = {
  headerFontSize: 24,
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
  const required = ['Numero', 'Fecha', 'Cliente', 'totalFactura', 'cart', 'cantidades', 'subTotal', 'impuesto15', 'totalWords'];

  for (const field of required) {
    if (!params[field]) {
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

  doc.setFontSize(16);
  doc.text(COMPANY_CONFIG.shortName, 85, 25);

  doc.text(`${TEXTS.invoice} 000-000-00-${invoiceData.Numero}`, LAYOUT.margin, 33);
  doc.text(COMPANY_CONFIG.address, 100, 33);

  doc.setFontSize(STYLES.smallFontSize);
  doc.text(`RTN: ${COMPANY_CONFIG.rtn}`, LAYOUT.margin, 40);
  doc.text(`CAI: ${COMPANY_CONFIG.cai}`, LAYOUT.margin, 45);
  doc.text(TEXTS.original, 100, 40);
  doc.text(`${TEXTS.issuedDate}: ${invoiceData.Fecha}`, 100, 45);
  doc.text(`${TEXTS.authorizedRange}: ${COMPANY_CONFIG.caiRange}`, 100, 50);
  doc.text(`${TEXTS.emissionLimit}: ${COMPANY_CONFIG.emissionLimit}`, 100, 55);
}

/**
 * Adds client information to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Object} clientData - Client data
 */
function addClientInfo(doc, clientData) {
  doc.text(`${TEXTS.client}: ${clientData.Cliente}`, LAYOUT.margin, 50);
  doc.text(`RTN del cliente: ${clientData.cantidades.rtnCliente}`, LAYOUT.margin, 55);
}

/**
 * Adds the items table to the PDF
 * @param {jsPDF} doc - PDF document
 * @param {Array} cart - Cart items
 */
function addItemsTable(doc, cart) {
  const columns = ["Producto", "Cantidad", "Precio", "Total"];

  doc.autoTable({
    head: [columns],
    body: cart.map((item) => [
      item.Nombre,
      item.Cantidad,
      item.Precio,
      `${(item.Precio * item.Cantidad).toFixed(2)} ${STYLES.currency}`,
    ]),
    theme: "plain",
    headStyles: {
      fillColor: STYLES.primaryColor,
      textColor: "white",
      fontSize: STYLES.normalFontSize
    },
    margin: { top: LAYOUT.tableMargin },
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

  const lines = [
    { label: TEXTS.discountRebates, value: totals.cantidades.cantidadDescuento },
    { label: TEXTS.exoneratedAmount, value: totals.cantidades.cantidadExonerado },
    { label: TEXTS.exemptAmount, value: totals.cantidades.cantidadExento },
    { label: TEXTS.taxable15, value: totals.subTotal },
    { label: TEXTS.taxable18, value: 0 },
    { label: TEXTS.tax15, value: totals.impuesto15 },
    { label: TEXTS.tax18, value: 0 },
    { label: TEXTS.total, value: totals.totalFactura }
  ];

  lines.forEach((line, index) => {
    const y = startY + (index * 7);
    doc.text(`${line.label}:`, LAYOUT.margin, y);
    doc.text(`${line.value} ${STYLES.currency}.`, LAYOUT.rightAlignX, y);
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
 * @param {number} params.impuesto15 - 15% tax amount
 * @param {string} params.totalWords - Total amount in words
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
      returnBlob = false
    } = options;

    // Create PDF document
    const doc = new jsPDF();

    // Add sections
    addHeader(doc, params);
    addClientInfo(doc, params);
    addItemsTable(doc, params.cart);
    addTotalsSection(doc, params);

    // Handle output options
    if (returnBlob) {
      return doc.output('blob');
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

