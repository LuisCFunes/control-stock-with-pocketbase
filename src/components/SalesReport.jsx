import { useState } from "react";
import { invoiceService, clientService } from "../services";
import { exportStyledExcel } from "../utilities/excelHelper";
import jsPDF from "jspdf";
import "jspdf-autotable";

const FACTURA_PREFIX = "000-000-00-";
const COMPANY_NAME = "Industrial de Alimentos E. YL., S.A. de C.V";

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

const buildRows = (records, clientesMap = new Map()) =>
  records.map((r) => {
    let rtn = "-";
    const rawRtn = (r.RTN || r.rtn || "").toString().trim();
    const clienteName = (r.Cliente || "").trim();
    const isConsumidorFinal =
      !clienteName || clienteName.toLowerCase() === "consumidor final";

    if (!isConsumidorFinal) {
      if (rawRtn && rawRtn !== "0" && rawRtn !== "-") {
        rtn = rawRtn;
      } else {
        const mappedRtn = (
          clientesMap.get(clienteName.toLowerCase()) || ""
        )
          .toString()
          .trim();
        if (mappedRtn && mappedRtn !== "0" && mappedRtn !== "-") {
          rtn = mappedRtn;
        }
      }
    }

    return {
      fecha: r.created ? formatDateDMY(r.created) : "",
      factura: formatFactura(r.Numero),
      cliente: r.Cliente || "",
      rtn,
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
    };
  });

const TABLE_HEADERS = [
  "Fecha",
  "Factura",
  "Cliente",
  "RTN",
  "Condición",
  "Forma pago",
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
  { key: "factura", header: "Factura", align: "center", width: 20 },
  { key: "cliente", header: "Cliente", align: "left", width: 28 },
  { key: "rtn", header: "RTN", align: "center", width: 18 },
  { key: "condicion", header: "Condición", align: "center", width: 15 },
  { key: "formapago", header: "Forma pago", align: "center", width: 16 },
  { key: "exento", header: "Exento", align: "right", numFmt: "#,##0.00", isTotal: true, width: 15 },
  { key: "exonerado", header: "Exonerado", align: "right", numFmt: "#,##0.00", isTotal: true, width: 15 },
  { key: "gravado15", header: "Gravado 15%", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
  { key: "isv15", header: "ISV 15%", align: "right", numFmt: "#,##0.00", isTotal: true, width: 15 },
  { key: "gravado18", header: "Gravado 18%", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
  { key: "isv18", header: "ISV 18%", align: "right", numFmt: "#,##0.00", isTotal: true, width: 15 },
  { key: "total", header: "Total", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
  { key: "observacion", header: "Observación", align: "left", width: 25 },
];

const PAGE_SIZE = 10;

const formatMoney = (val) =>
  Number(val || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function SalesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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

      const [records, clientesList] = await Promise.all([
        invoiceService.getInvoices({
          ...(filter ? { filter } : {}),
          sort: "+Numero,+created",
        }),
        clientService.getClients().catch(() => []),
      ]);

      const clientesMap = new Map();
      clientesList.forEach((c) => {
        if (c.Nombre && c.RTN) {
          clientesMap.set(c.Nombre.trim().toLowerCase(), c.RTN.trim());
        }
      });

      // Ordenar de arriba para abajo por número de factura (menor arriba, mayor abajo)
      // Si el número de factura no existe o son iguales, por fecha de antigüedad (+created, más antigua arriba)
      records.sort((a, b) => {
        const numA = Number(a.Numero);
        const numB = Number(b.Numero);
        const hasNumA = !isNaN(numA) && numA > 0;
        const hasNumB = !isNaN(numB) && numB > 0;

        if (hasNumA && hasNumB) {
          if (numA !== numB) return numA - numB;
        } else if (hasNumA) {
          return -1;
        } else if (hasNumB) {
          return 1;
        }

        const dateA = new Date(a.created).getTime() || 0;
        const dateB = new Date(b.created).getTime() || 0;
        return dateA - dateB;
      });

      const rows = buildRows(records, clientesMap);

      const totals = {
        exento: rows.reduce((sum, r) => sum + r.exento, 0),
        exonerado: rows.reduce((sum, r) => sum + r.exonerado, 0),
        gravado15: rows.reduce((sum, r) => sum + r.gravado15, 0),
        isv15: rows.reduce((sum, r) => sum + r.isv15, 0),
        gravado18: rows.reduce((sum, r) => sum + r.gravado18, 0),
        isv18: rows.reduce((sum, r) => sum + r.isv18, 0),
        total: rows.reduce((sum, r) => sum + r.total, 0),
      };

      setReportData({
        totalSales: totals.total,
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
        totals,
      });
      setCurrentPage(1);
      setGeneratedAt(new Date());
    } catch (error) {
      if (error?.isAbort) return;
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

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_NAME, 8, 10);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generado el: ${generatedAt ? generatedAt.toLocaleString("es-HN") : ""}`,
      289,
      10,
      { align: "right" }
    );

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Ventas", 8, 16);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Período: ${formatDateDMY(startDate) || "inicio"} — ${formatDateDMY(endDate) || "hoy"}`,
      8,
      21
    );

    const tableData = reportData.rows.map((r) => [
      r.fecha,
      r.factura,
      r.cliente,
      r.rtn,
      r.condicion,
      r.formapago,
      formatMoney(r.exento),
      formatMoney(r.exonerado),
      formatMoney(r.gravado15),
      formatMoney(r.isv15),
      formatMoney(r.gravado18),
      formatMoney(r.isv18),
      formatMoney(r.total),
      r.observacion,
    ]);

    const totals = reportData.totals || {
      exento: reportData.rows.reduce((sum, r) => sum + r.exento, 0),
      exonerado: reportData.rows.reduce((sum, r) => sum + r.exonerado, 0),
      gravado15: reportData.rows.reduce((sum, r) => sum + r.gravado15, 0),
      isv15: reportData.rows.reduce((sum, r) => sum + r.isv15, 0),
      gravado18: reportData.rows.reduce((sum, r) => sum + r.gravado18, 0),
      isv18: reportData.rows.reduce((sum, r) => sum + r.isv18, 0),
      total: reportData.rows.reduce((sum, r) => sum + r.total, 0),
    };

    const footRow = [
      { content: "TOTALES", styles: { halign: "center", fontStyle: "bold" } },
      "",
      "",
      "",
      "",
      "",
      { content: formatMoney(totals.exento), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totals.exonerado), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totals.gravado15), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totals.isv15), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totals.gravado18), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totals.isv18), styles: { halign: "right", fontStyle: "bold" } },
      { content: formatMoney(totals.total), styles: { halign: "right", fontStyle: "bold" } },
      "",
    ];

    doc.autoTable({
      head: [TABLE_HEADERS],
      body: tableData,
      foot: [footRow],
      startY: 25,
      margin: { left: 8, right: 8, top: 25, bottom: 10 },
      styles: {
        fontSize: 6.5,
        cellPadding: 1.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [31, 23, 23],
        textColor: "white",
        fontSize: 6.8,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
        fontSize: 6.8,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" }, // Fecha
        1: { cellWidth: 22, halign: "center" }, // Factura
        2: { cellWidth: 36, halign: "left" },   // Cliente
        3: { cellWidth: 22, halign: "center" }, // RTN
        4: { cellWidth: 16, halign: "center" }, // Condición
        5: { cellWidth: 16, halign: "center" }, // Forma pago
        6: { cellWidth: 17, halign: "right" },  // Exento
        7: { cellWidth: 17, halign: "right" },  // Exonerado
        8: { cellWidth: 18, halign: "right" },  // Gravado 15%
        9: { cellWidth: 15, halign: "right" },  // ISV 15%
        10: { cellWidth: 18, halign: "right" }, // Gravado 18%
        11: { cellWidth: 15, halign: "right" }, // ISV 18%
        12: { cellWidth: 19, halign: "right" }, // Total
        13: { cellWidth: 35, halign: "left" },  // Observación
      },
      didParseCell: (data) => {
        const colIdx = data.column.index;
        if (colIdx >= 6 && colIdx <= 12) {
          data.cell.styles.halign = "right";
        } else if (colIdx === 0 || colIdx === 1 || colIdx === 3 || colIdx === 4 || colIdx === 5) {
          data.cell.styles.halign = "center";
        } else {
          data.cell.styles.halign = "left";
        }
      },
    });

    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  };

  const totalPages = Math.ceil((reportData?.rows?.length || 0) / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, reportData?.rows?.length || 0);
  const currentRows = (reportData?.rows || []).slice(startIndex, endIndex);
  const totals = reportData?.totals;

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
                    <div className="stat-value">L. {formatMoney(reportData.totalSales)}</div>
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
                Abrir PDF
              </button>
            </div>
          </div>

          <div className="card-body p-0 border-top">
            <div className="table-responsive">
              <table className="table-app">
                <thead>
                  <tr>
                    <th className="text-center">Fecha</th>
                    <th className="text-center">Factura</th>
                    <th>Cliente</th>
                    <th className="text-center">RTN</th>
                    <th className="text-center">Condición</th>
                    <th className="text-center">Forma pago</th>
                    <th className="text-end">Exento</th>
                    <th className="text-end">Exonerado</th>
                    <th className="text-end">Gravado 15%</th>
                    <th className="text-end">ISV 15%</th>
                    <th className="text-end">Gravado 18%</th>
                    <th className="text-end">ISV 18%</th>
                    <th className="text-end">Total</th>
                    <th>Observación</th>
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
                  {currentRows.map((r, index) => (
                    <tr key={index}>
                      <td className="text-center text-nowrap">{r.fecha}</td>
                      <td className="text-center fw-semibold text-nowrap">{r.factura}</td>
                      <td>{r.cliente}</td>
                      <td className="text-center font-monospace">{r.rtn}</td>
                      <td className="text-center">
                        <span
                          className={`badge ${
                            r.condicion === "Credito"
                              ? "bg-warning-subtle text-warning-emphasis"
                              : "bg-light text-dark"
                          } border`}
                        >
                          {r.condicion}
                        </span>
                      </td>
                      <td className="text-center">{r.formapago || "—"}</td>
                      <td className="text-end">{formatMoney(r.exento)}</td>
                      <td className="text-end">{formatMoney(r.exonerado)}</td>
                      <td className="text-end">{formatMoney(r.gravado15)}</td>
                      <td className="text-end">{formatMoney(r.isv15)}</td>
                      <td className="text-end">{formatMoney(r.gravado18)}</td>
                      <td className="text-end">{formatMoney(r.isv18)}</td>
                      <td className="text-end fw-bold text-dark">{formatMoney(r.total)}</td>
                      <td>{r.observacion || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                {reportData.rows.length > 0 && totals && (
                  <tfoot className="table-light fw-bold border-top border-2">
                    <tr className="align-middle">
                      <td className="text-center">TOTALES</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="text-end">{formatMoney(totals.exento)}</td>
                      <td className="text-end">{formatMoney(totals.exonerado)}</td>
                      <td className="text-end">{formatMoney(totals.gravado15)}</td>
                      <td className="text-end">{formatMoney(totals.isv15)}</td>
                      <td className="text-end">{formatMoney(totals.gravado18)}</td>
                      <td className="text-end">{formatMoney(totals.isv18)}</td>
                      <td className="text-end text-primary fw-bold">{formatMoney(totals.total)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {reportData.rows.length > 0 && (
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 border-top bg-light bg-opacity-50">
                <span className="text-muted small">
                  Mostrando facturas <strong>{startIndex + 1}</strong> a{" "}
                  <strong>{endIndex}</strong> de un total de{" "}
                  <strong>{reportData.rows.length}</strong> (Página {currentPage} de {totalPages})
                </span>
                {totalPages > 1 && (
                  <nav aria-label="Paginación de facturas">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-left me-1"></i> Anterior
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - currentPage) <= 1
                        )
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) {
                            acc.push("ellipsis-" + p);
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item) =>
                          typeof item === "string" ? (
                            <li key={item} className="page-item disabled">
                              <span className="page-link">…</span>
                            </li>
                          ) : (
                            <li
                              key={item}
                              className={`page-item ${currentPage === item ? "active" : ""}`}
                            >
                              <button
                                type="button"
                                className="page-link"
                                onClick={() => setCurrentPage(item)}
                              >
                                {item}
                              </button>
                            </li>
                          )
                        )}
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
