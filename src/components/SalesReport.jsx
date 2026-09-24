import { useState } from "react";
import { pb } from "../utilities/pocketbase_route";
import { exportStyledExcel } from "../utilities/excelHelper";
import jsPDF from "jspdf";
import "jspdf-autotable";

const FACTURA_PREFIX = "000-000-00-";

const formatFactura = (num) => `${FACTURA_PREFIX}${num}`;

const fmt = (value) => Number(value || 0);

const formatDateDMY = (val) => {
  if (!val) return "";
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[3].padStart(2, "0")}/${isoMatch[2].padStart(2, "0")}/${isoMatch[1]}`;
    }
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const buildRows = (records) =>
  records.map((r) => ({
    fecha: r.created ? formatDateDMY(r.created) : "",
    cliente: r.Cliente || "",
    factura: formatFactura(r.Numero),
    condicion: r.condicion || "",
    formapago: r.formapago || "",
    detalle: r.detalle || "",
    exento: fmt(r.exento_amount),
    exonerado: fmt(r.exonerado_amount),
    gravado15: fmt(r.subtotal15),
    isv15: fmt(r.isv15),
    gravado18: fmt(r.subtotal18),
    isv18: fmt(r.isv18),
    total: fmt(r.Total),
    observacion: r.observacion || "",
  }));

const TABLE_HEADERS = [
  "Fecha",
  "Cliente",
  "Factura",
  "Condición",
  "Forma pago",
  "Detalle",
  "Exento",
  "Exonerado",
  "Gravado 15%",
  "ISV 15%",
  "Gravado 18%",
  "ISV 18%",
  "Total",
  "Observación",
];

const EXCEL_COLUMNS = [
  { key: "fecha", header: "Fecha", align: "center", width: 14 },
  { key: "cliente", header: "Cliente", align: "left", width: 28 },
  { key: "factura", header: "Factura", align: "center", width: 20 },
  { key: "condicion", header: "Condición", align: "center", width: 15 },
  { key: "formapago", header: "Forma pago", align: "center", width: 16 },
  { key: "detalle", header: "Detalle", align: "left", width: 30 },
  { key: "exento", header: "Exento", align: "right", numFmt: "#,##0.00", isTotal: true, width: 15 },
  { key: "exonerado", header: "Exonerado", align: "right", numFmt: "#,##0.00", isTotal: true, width: 15 },
  { key: "gravado15", header: "Gravado 15%", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
  { key: "isv15", header: "ISV 15%", align: "right", numFmt: "#,##0.00", isTotal: true, width: 15 },
  { key: "gravado18", header: "Gravado 18%", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
  { key: "isv18", header: "ISV 18%", align: "right", numFmt: "#,##0.00", isTotal: true, width: 15 },
  { key: "total", header: "Total", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
  { key: "observacion", header: "Observación", align: "left", width: 25 },
];

export function SalesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      let filter = "";
      if (startDate) filter += `created >= "${new Date(startDate + "T00:00:00").toISOString()}"`;
      if (endDate) {
        if (filter) filter += " && ";
        filter += `created <= "${new Date(endDate + "T23:59:59.999").toISOString()}"`;
      }
      if (customerFilter) {
        if (filter) filter += " && ";
        filter += `Cliente ~ "${customerFilter}"`;
      }

      const records = await pb.collection("Facturas").getFullList({
        ...(filter ? { filter } : {}),
        sort: "-created",
      });

      const rows = buildRows(records);

      setReportData({
        totalSales: rows.reduce((sum, r) => sum + r.total, 0),
        numTransactions: rows.length,
        productsSold: records.reduce(
          (sum, r) =>
            sum +
            (Array.isArray(r.ProductosV)
              ? r.ProductosV.reduce((a, p) => a + (Number(p.Cantidad) || 0), 0)
              : 0),
          0
        ),
        rows,
      });
      setGeneratedAt(new Date());
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!reportData) return;
    exportStyledExcel({
      fileName: "reporte_ventas.xlsx",
      sheetName: "Reporte de Ventas",
      columns: EXCEL_COLUMNS,
      data: reportData.rows,
      includeTotals: true,
    });
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Reporte de Ventas", 14, 10);
    doc.text(
      `Generado el: ${generatedAt ? generatedAt.toLocaleString("es-HN") : ""}`,
      280,
      10,
      { align: "right" }
    );
    doc.text(`Período: ${formatDateDMY(startDate) || "inicio"} - ${formatDateDMY(endDate) || "hoy"}`, 14, 20);
    doc.text(`Total Ventas: ${reportData.totalSales.toFixed(2)}`, 14, 30);
    doc.text(`Número de Transacciones: ${reportData.numTransactions}`, 14, 40);

    const tableData = reportData.rows.map((r) => [
      r.fecha,
      r.cliente,
      r.factura,
      r.condicion,
      r.formapago,
      r.detalle,
      r.exento,
      r.exonerado,
      r.gravado15,
      r.isv15,
      r.gravado18,
      r.isv18,
      r.total,
      r.observacion,
    ]);

    doc.autoTable({
      head: [TABLE_HEADERS],
      body: tableData,
      startY: 50,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [31, 23, 23], textColor: "white" },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 18 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 16 },
        7: { cellWidth: 18 },
        8: { cellWidth: 18 },
        9: { cellWidth: 15 },
        10: { cellWidth: 18 },
        11: { cellWidth: 15 },
        12: { cellWidth: 18 },
        13: { cellWidth: 30 },
      },
    });

    doc.save("reporte_ventas.pdf");
  };

  return (
    <div className="app-card">
      <div className="card-header">
        <h5>
          <i className="bi bi-funnel me-2 text-primary"></i>
          Filtros del reporte
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-3">
            <label htmlFor="startDate" className="form-label">
              Fecha inicio
            </label>
            <input
              type="date"
              id="startDate"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="endDate" className="form-label">
              Fecha fin
            </label>
            <input
              type="date"
              id="endDate"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label htmlFor="customerFilter" className="form-label">
              Cliente
            </label>
            <input
              type="text"
              id="customerFilter"
              className="form-control"
              placeholder="Filtrar por cliente"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            />
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-app btn-primary-custom w-100" onClick={generateReport} disabled={loading}>
              <i className="bi bi-search"></i>
              {loading ? "Generando..." : "Generar reporte"}
            </button>
          </div>
        </div>
      </div>

      {!reportData && !loading && (
        <div className="card-body border-top">
          <div className="empty-state">
            <i className="bi bi-graph-up-arrow"></i>
            <h5>Aún no hay reporte</h5>
            <p>Configura los filtros y haz clic en Generar reporte.</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="card-body border-top">
          <div className="empty-state">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Consultando las ventas...</p>
          </div>
        </div>
      )}

      {reportData && !loading && (
        <>
          <div className="card-body border-top">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <span className="text-muted small">
                <i className="bi bi-calendar-check me-1"></i>
                Reporte generado el:{" "}
                <strong>
                  {generatedAt ? generatedAt.toLocaleString("es-HN") : ""}
                </strong>
              </span>
              <span className="text-muted small">
                Período: {formatDateDMY(startDate) || "inicio"} — {formatDateDMY(endDate) || "hoy"}
              </span>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-icon green">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                  <div>
                    <div className="stat-label">Total ventas</div>
                    <div className="stat-value">L. {reportData.totalSales.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-icon indigo">
                    <i className="bi bi-receipt"></i>
                  </div>
                  <div>
                    <div className="stat-label">Transacciones</div>
                    <div className="stat-value">{reportData.numTransactions}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div className="stat-icon cyan">
                    <i className="bi bi-box-seam"></i>
                  </div>
                  <div>
                    <div className="stat-label">Productos vendidos</div>
                    <div className="stat-value">{reportData.productsSold}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-success" onClick={exportExcel}>
                <i className="bi bi-file-earmark-excel me-1"></i>
                Exportar Excel
              </button>
              <button className="btn btn-outline-danger" onClick={exportPDF}>
                <i className="bi bi-file-earmark-pdf me-1"></i>
                Exportar PDF
              </button>
            </div>
          </div>

          <div className="card-body p-0 border-top">
            <div className="table-responsive">
              <table className="table-app">
                <thead>
                  <tr>
                    {TABLE_HEADERS.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.length === 0 && (
                    <tr>
                      <td colSpan={TABLE_HEADERS.length}>
                        <div className="empty-state">
                          <i className="bi bi-inbox"></i>
                          <p className="mb-0">No hay ventas en el período seleccionado.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {reportData.rows.map((r, index) => (
                    <tr key={index}>
                      <td>{r.fecha}</td>
                      <td>{r.cliente}</td>
                      <td>{r.factura}</td>
                      <td>{r.condicion}</td>
                      <td>{r.formapago}</td>
                      <td>{r.detalle}</td>
                      <td>{r.exento}</td>
                      <td>{r.exonerado}</td>
                      <td>{r.gravado15}</td>
                      <td>{r.isv15}</td>
                      <td>{r.gravado18}</td>
                      <td>{r.isv18}</td>
                      <td>{r.total}</td>
                      <td>{r.observacion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
