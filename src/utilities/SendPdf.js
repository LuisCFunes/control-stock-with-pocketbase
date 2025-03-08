import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function sendPdf({
  Numero,
  Fecha,
  Cliente,
  totalFactura,
  cart,
  cantidades,
  subTotal,
  impuesto15,
  totalWords,
}) {
  const doc = new jsPDF();
  const columns = ["Producto", "Cantidad", "Precio", "Total"];
  doc.setFontSize(24);
  doc.text("Industrial de Alimentos E. YL., S.A. de C.V", 14, 17);
  doc.setFontSize(16);
  doc.text("INSUMOS E. Y L.", 85, 25);
  doc.text(`Factura 000-000-00-${Numero}`, 14, 33);
  doc.text("San Pedro Sula,Carretera El Carmen", 100, 33);
  doc.setFontSize(9);
  doc.text("RTN:08019007088535", 14, 40);
  doc.text("CAI: 9ACDC8-FC347E-7B43B8-7790B8-3E2429-99", 14, 45);
  doc.text("Factura Original", 100, 40);
  doc.text(`Fecha emitida: ${Fecha}`, 100, 45);
  doc.text(
    "Autorizado del: 001-002-01-00062371 al 001-002-01-00072370",
    100,
    50,
  );
  doc.text(`Fecha Limite de Emision: 2023-12-15`, 100, 55);
  doc.text(`Cliente: ${Cliente}`, 14, 50);
  doc.text(`RTN del cliente: ${cantidades.rtnCliente}`, 14, 55);
  doc.autoTable({
    head: [columns],
    body: cart.map((item) => [
      item.Nombre,
      item.Cantidad,
      item.Precio,
      `${item.Precio * item.Cantidad} Lps`,
    ]),
    theme: "plain",
    headStyles: { fillColor: "#1F1717", textColor: "white" },
    margin: { top: 65 },
    tableWidth: "auto",
  });
  doc.setFontSize(12);
  doc.text(`Desc. Y Reb Otorgados:`, 14, doc.autoTable.previous.finalY + 10);
  doc.text(
    `${cantidades.cantidadDescuento} Lps.`,
    155,
    doc.autoTable.previous.finalY + 10,
  );
  doc.text(`Importe Exonerado:`, 14, doc.autoTable.previous.finalY + 17);
  doc.text(
    `${cantidades.cantidadExonerado} Lps.`,
    155,
    doc.autoTable.previous.finalY + 17,
  );
  doc.text(`Importe Exento:`, 14, doc.autoTable.previous.finalY + 24);
  doc.text(
    `${cantidades.cantidadExento} Lps.`,
    155,
    doc.autoTable.previous.finalY + 24,
  );
  doc.text(`Importe Grabado 15%:`, 14, doc.autoTable.previous.finalY + 31);
  doc.text(`${subTotal} Lps.`, 155, doc.autoTable.previous.finalY + 31);
  doc.text(`Importe Grabado 18%:`, 14, doc.autoTable.previous.finalY + 38);
  doc.text(`0 Lps.`, 155, doc.autoTable.previous.finalY + 38);
  doc.text(`Impuesto 15%:`, 14, doc.autoTable.previous.finalY + 45);
  doc.text(`${impuesto15} Lps.`, 155, doc.autoTable.previous.finalY + 45);
  doc.text(`Impuesto 18%:`, 14, doc.autoTable.previous.finalY + 52);
  doc.text(`0 Lps.`, 155, doc.autoTable.previous.finalY + 52);
  doc.text(`Total:`, 14, doc.autoTable.previous.finalY + 58);
  doc.text(`${totalFactura} Lps.`, 155, doc.autoTable.previous.finalY + 58);
  doc.text(`Son: ${totalWords}`, 14, doc.autoTable.previous.finalY + 64);
  doc.save("factura.pdf");
}

