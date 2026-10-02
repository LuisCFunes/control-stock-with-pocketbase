/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback, useMemo } from "react";
import { invoiceService } from "../services";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { exportStyledExcel } from "../utilities/excelHelper";

const COMPANY_NAME = "Industrial de Alimentos E. YL., S.A. de C.V";
const PAGE_SIZE = 10;

const money = (val) =>
  `L. ${Number(val || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatMoney = (val) =>
  Number(val || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateDMY = (val) => {
  if (!val) return "—";
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

export function CreditosReport({ isModal = false, onClose, initialClient = "todos" }) {
  // Filtros
  const [selectedClient, setSelectedClient] = useState(initialClient);
  const [customerSearch, setCustomerSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [agingFilter, setAgingFilter] = useState("pendientes"); // "pendientes", "30", "60", "90", "mas90", "pagadas", "todas"
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");

  // Si se selecciona un cliente específico, no permitimos "pagadas" porque se restringe a facturas por cobrar
  useEffect(() => {
    if (selectedClient !== "todos" && agingFilter === "pagadas") {
      setAgingFilter("pendientes");
    }
  }, [selectedClient, agingFilter]);

  // Datos
  const [allRawFacturas, setAllRawFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar facturas de crédito desde PocketBase
  const fetchAllCreditos = useCallback(async () => {
    setLoading(true);
    try {
      const records = await invoiceService.getInvoices({
        filter: 'condicion = "Credito"',
        sort: "+Numero,+created",
      });
      setAllRawFacturas(records);
      setGeneratedAt(new Date());
    } catch (err) {
      if (err?.isAbort) return;
      console.error("Error al cargar créditos para reporte:", err);
      alert("Error al cargar los datos de crédito.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCreditos();
  }, [fetchAllCreditos]);

  // Lista única de clientes para el selector
  const clientesList = useMemo(() => {
    const set = new Set();
    allRawFacturas.forEach((f) => {
      if (f.Cliente && f.Cliente.trim()) {
        set.add(f.Cliente.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [allRawFacturas]);

  // Normalizar datos con tramos de antigüedad
  const normalizedList = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return allRawFacturas.map((f) => {
      const total = Number(f.Total || 0);
      const abonos = Array.isArray(f.abonos) ? f.abonos : [];
      const totalAbonado = abonos.reduce((sum, a) => sum + Number(a.monto || 0), 0);

      const saldoPendiente =
        f.saldo_pendiente !== undefined && f.saldo_pendiente !== null
          ? Number(f.saldo_pendiente)
          : Math.max(total - totalAbonado, 0);

      let rawDate = f.fecha_emision || f.created;
      let fechaEmision = rawDate ? new Date(rawDate) : new Date();
      if (isNaN(fechaEmision.getTime())) {
        fechaEmision = new Date();
      }
      const fechaEmisionSinHora = new Date(fechaEmision);
      fechaEmisionSinHora.setHours(0, 0, 0, 0);

      const diffMs = hoy.getTime() - fechaEmisionSinHora.getTime();
      const diasTranscurridos = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let tramo = "30";
      if (diasTranscurridos > 90) {
        tramo = "mas90";
      } else if (diasTranscurridos > 60) {
        tramo = "90";
      } else if (diasTranscurridos > 30) {
        tramo = "60";
      } else {
        tramo = "30";
      }

      const saldo30 = saldoPendiente > 0 && tramo === "30" ? saldoPendiente : 0;
      const saldo60 = saldoPendiente > 0 && tramo === "60" ? saldoPendiente : 0;
      const saldo90 = saldoPendiente > 0 && tramo === "90" ? saldoPendiente : 0;
      const saldoMas90 = saldoPendiente > 0 && tramo === "mas90" ? saldoPendiente : 0;

      let estado =
        f.estado_pago || (saldoPendiente <= 0 ? "Pagada" : totalAbonado > 0 ? "Abonado" : "Pendiente");

      return {
        ...f,
        total,
        totalAbonado,
        saldoPendiente,
        fechaEmision,
        diasTranscurridos,
        tramo,
        saldo30,
        saldo60,
        saldo90,
        saldoMas90,
        estado,
      };
    });
  }, [allRawFacturas]);

  // Aplicar todos los filtros seleccionados
  const filteredFacturas = useMemo(() => {
    return normalizedList.filter((f) => {
      // 1. Filtro por cliente seleccionado
      if (selectedClient !== "todos") {
        if (f.Cliente?.trim() !== selectedClient) {
          return false;
        }
        // Restricción: si se selecciona un solo cliente se muestran exclusivamente sus facturas por cobrar
        if (f.saldoPendiente <= 0) {
          return false;
        }
      }

      // 2. Búsqueda por cliente texto (solo activa si no hay cliente específico seleccionado)
      if (selectedClient === "todos" && customerSearch) {
        const cTerm = customerSearch.toLowerCase();
        if (!f.Cliente || !f.Cliente.toLowerCase().includes(cTerm)) {
          return false;
        }
      }

      // 3. Rango de fechas
      if (startDate) {
        const start = new Date(startDate + "T00:00:00");
        if (f.fechaEmision < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + "T23:59:59.999");
        if (f.fechaEmision > end) return false;
      }

      // 4. Filtro por tramo de antigüedad / estado
      if (selectedClient === "todos") {
        if (agingFilter === "pendientes" && f.saldoPendiente <= 0) return false;
        if (agingFilter === "30" && f.saldo30 <= 0) return false;
        if (agingFilter === "60" && f.saldo60 <= 0) return false;
        if (agingFilter === "90" && f.saldo90 <= 0) return false;
        if (agingFilter === "mas90" && f.saldoMas90 <= 0) return false;
        if (agingFilter === "pagadas" && f.saldoPendiente > 0) return false;
      } else {
        // Para un solo cliente (ya restringido a saldoPendiente > 0),
        // se puede filtrar por tramo específico si se desea:
        if (agingFilter === "30" && f.saldo30 <= 0) return false;
        if (agingFilter === "60" && f.saldo60 <= 0) return false;
        if (agingFilter === "90" && f.saldo90 <= 0) return false;
        if (agingFilter === "mas90" && f.saldoMas90 <= 0) return false;
      }

      // 5. Monto mínimo
      if (minAmount && Number(minAmount) > 0) {
        if (f.saldoPendiente < Number(minAmount)) return false;
      }

      // 6. Búsqueda por número de factura o detalle
      if (invoiceSearch) {
        const iTerm = invoiceSearch.toLowerCase();
        const matchesNumero = f.Numero && String(f.Numero).includes(iTerm);
        const matchesObs = f.observacion && f.observacion.toLowerCase().includes(iTerm);
        const matchesDet = f.detalle && f.detalle.toLowerCase().includes(iTerm);
        if (!matchesNumero && !matchesObs && !matchesDet) return false;
      }

      return true;
    });
  }, [
    normalizedList,
    selectedClient,
    customerSearch,
    startDate,
    endDate,
    agingFilter,
    minAmount,
    invoiceSearch,
  ]);

  // Ordenamiento de arriba hacia abajo (menor número arriba, mayor abajo; o antigüedad de emisión)
  const sortedFacturas = useMemo(() => {
    return [...filteredFacturas].sort((a, b) => {
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

      const dateA = new Date(a.fecha_emision || a.created).getTime() || 0;
      const dateB = new Date(b.fecha_emision || b.created).getTime() || 0;
      return dateA - dateB;
    });
  }, [filteredFacturas]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedClient,
    customerSearch,
    startDate,
    endDate,
    agingFilter,
    invoiceSearch,
    minAmount,
  ]);

  // Resumen consolidado por cliente (usado cuando selectedClient === "todos")
  const clientSummaryRows = useMemo(() => {
    const map = new Map();

    sortedFacturas.forEach((f) => {
      const clientName = f.Cliente?.trim() || "Consumidor Final";
      if (!map.has(clientName)) {
        map.set(clientName, {
          cliente: clientName,
          cantFacturas: 0,
          saldo30: 0,
          saldo60: 0,
          saldo90: 0,
          saldoMas90: 0,
          total: 0,
          totalAbonado: 0,
          saldoPendiente: 0,
        });
      }

      const row = map.get(clientName);
      row.cantFacturas += 1;
      row.saldo30 += f.saldo30;
      row.saldo60 += f.saldo60;
      row.saldo90 += f.saldo90;
      row.saldoMas90 += f.saldoMas90;
      row.total += f.total;
      row.totalAbonado += f.totalAbonado;
      row.saldoPendiente += f.saldoPendiente;
    });

    return Array.from(map.values()).sort((a, b) =>
      a.cliente.localeCompare(b.cliente, "es", { sensitivity: "base" })
    );
  }, [sortedFacturas]);

  // Totales generales para métricas
  const totals = useMemo(() => {
    return {
      saldo30: sortedFacturas.reduce((sum, f) => sum + f.saldo30, 0),
      saldo60: sortedFacturas.reduce((sum, f) => sum + f.saldo60, 0),
      saldo90: sortedFacturas.reduce((sum, f) => sum + f.saldo90, 0),
      saldoMas90: sortedFacturas.reduce((sum, f) => sum + f.saldoMas90, 0),
      totalFactura: sortedFacturas.reduce((sum, f) => sum + f.total, 0),
      totalAbonado: sortedFacturas.reduce((sum, f) => sum + f.totalAbonado, 0),
      totalPendiente: sortedFacturas.reduce((sum, f) => sum + f.saldoPendiente, 0),
      cantPendientes: sortedFacturas.filter((f) => f.saldoPendiente > 0).length,
      cantTotal: sortedFacturas.length,
      cantClientes: clientSummaryRows.length,
    };
  }, [sortedFacturas, clientSummaryRows]);

  // Paginación: si es "todos" se pagina por cliente; si es un cliente individual, por factura
  const activeDataset = selectedClient === "todos" ? clientSummaryRows : sortedFacturas;
  const totalPages = Math.ceil(activeDataset.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = activeDataset.slice(startIndex, startIndex + PAGE_SIZE);

  // Presets de fecha
  const handlePresetDate = (type) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");

    if (type === "all") {
      setStartDate("");
      setEndDate("");
    } else if (type === "thisMonth") {
      const firstDay = `${year}-${month}-01`;
      const lastDayDate = new Date(year, today.getMonth() + 1, 0);
      const lastDay = `${year}-${month}-${String(lastDayDate.getDate()).padStart(2, "0")}`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (type === "last30") {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      const pYear = past.getFullYear();
      const pMonth = String(past.getMonth() + 1).padStart(2, "0");
      const pDay = String(past.getDate()).padStart(2, "0");
      const tDay = String(today.getDate()).padStart(2, "0");
      setStartDate(`${pYear}-${pMonth}-${pDay}`);
      setEndDate(`${year}-${month}-${tDay}`);
    } else if (type === "thisYear") {
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    }
  };

  const handleResetFilters = () => {
    setSelectedClient("todos");
    setCustomerSearch("");
    setStartDate("");
    setEndDate("");
    setAgingFilter("pendientes");
    setInvoiceSearch("");
    setMinAmount("");
  };

  // Etiqueta legible de filtros para el reporte exportado
  const getFilterDescription = () => {
    const parts = [];
    if (selectedClient !== "todos") {
      parts.push(`Cliente: ${selectedClient} (Solo por cobrar)`);
    } else if (customerSearch) {
      parts.push(`Cliente contiene: "${customerSearch}"`);
    }

    if (startDate || endDate) {
      parts.push(
        `Período: ${formatDateDMY(startDate) || "inicio"} — ${formatDateDMY(endDate) || "hoy"}`
      );
    }

    const agingLabels = {
      pendientes: "Solo pendientes",
      30: "0 a 30 días",
      60: "31 a 60 días",
      90: "61 a 90 días",
      mas90: "Más de 90 días",
      pagadas: "Solo pagadas",
      todas: "Todas",
    };
    if (selectedClient === "todos" || agingFilter !== "pendientes") {
      parts.push(`Estado: ${agingLabels[agingFilter] || "Todas"}`);
    }

    if (minAmount && Number(minAmount) > 0) {
      parts.push(`Deuda mín.: L. ${formatMoney(minAmount)}`);
    }

    if (invoiceSearch) {
      parts.push(`Búsqueda: "${invoiceSearch}"`);
    }

    return parts.join("  |  ");
  };

  // ==========================================
  // EXPORTAR A PDF
  // ==========================================
  const handleExportPDF = () => {
    if (sortedFacturas.length === 0) return;

    const doc = new jsPDF({ orientation: "landscape" });

    // Encabezado institucional
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_NAME, 8, 10);

    const now = new Date();
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${now.toLocaleString("es-HN")}`, 289, 10, { align: "right" });

    const isSingleClient = selectedClient !== "todos";
    const reportTitle = isSingleClient
      ? `Estado de Cuenta - ${selectedClient}`
      : "Reporte General de Cuentas por Cobrar";

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, 8, 16);

    doc.setFontSize(7.8);
    doc.setFont("helvetica", "normal");
    const subText = isSingleClient
      ? `Cliente: ${selectedClient}  |  Facturas por Cobrar: ${sortedFacturas.length}  |  Total a Deber: ${money(totals.totalPendiente)}`
      : `${getFilterDescription()}  |  Total Clientes: ${clientSummaryRows.length}  |  Total a Deber: ${money(totals.totalPendiente)}`;
    doc.text(subText, 8, 21);

    if (isSingleClient) {
      // Estado de Cuenta de un solo cliente: solo sus facturas por cobrar
      const tableHeaders = [
        "No. Factura",
        "Emisión",
        "0 - 30 días",
        "31 - 60 días",
        "61 - 90 días",
        "+90 días",
        "Total Factura",
        "Abonado",
        "Total que debe",
      ];

      const tableData = sortedFacturas.map((f) => [
        String(f.Numero).startsWith("000-") ? f.Numero : `000-000-00-${f.Numero}`,
        (f.fecha_emision || f.created) ? formatDateDMY(f.fecha_emision || f.created) : "—",
        f.saldo30 > 0 ? formatMoney(f.saldo30) : "0.00",
        f.saldo60 > 0 ? formatMoney(f.saldo60) : "0.00",
        f.saldo90 > 0 ? formatMoney(f.saldo90) : "0.00",
        f.saldoMas90 > 0 ? formatMoney(f.saldoMas90) : "0.00",
        formatMoney(f.total),
        f.totalAbonado > 0 ? formatMoney(f.totalAbonado) : "0.00",
        formatMoney(f.saldoPendiente),
      ]);

      const footRow = [
        { content: "TOTALES", styles: { halign: "center", fontStyle: "bold" } },
        "",
        { content: formatMoney(totals.saldo30), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.saldo60), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.saldo90), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.saldoMas90), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.totalFactura), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.totalAbonado), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.totalPendiente), styles: { halign: "right", fontStyle: "bold" } },
      ];

      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        foot: [footRow],
        startY: 25,
        margin: { left: 8, right: 8, top: 25, bottom: 10 },
        styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [31, 23, 23], textColor: "white", fontSize: 7.5, fontStyle: "bold" },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold", fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 32, halign: "center" },
          1: { cellWidth: 26, halign: "center" },
          2: { cellWidth: 30, halign: "right" },
          3: { cellWidth: 30, halign: "right" },
          4: { cellWidth: 30, halign: "right" },
          5: { cellWidth: 30, halign: "right" },
          6: { cellWidth: 32, halign: "right" },
          7: { cellWidth: 32, halign: "right" },
          8: { cellWidth: 37, halign: "right" },
        },
        didParseCell: (data) => {
          const colIdx = data.column.index;
          if (colIdx >= 2 && colIdx <= 8) {
            data.cell.styles.halign = "right";
          } else {
            data.cell.styles.halign = "center";
          }
        },
      });
    } else {
      // Reporte general de todos los clientes: consolidado por cliente (sin No. Factura ni fecha)
      const tableHeaders = [
        "Cliente",
        "0 - 30 días",
        "31 - 60 días",
        "61 - 90 días",
        "+90 días",
        "Total Factura",
        "Abonado",
        "Total que debe",
      ];

      const tableData = clientSummaryRows.map((r) => [
        r.cliente,
        r.saldo30 > 0 ? formatMoney(r.saldo30) : "0.00",
        r.saldo60 > 0 ? formatMoney(r.saldo60) : "0.00",
        r.saldo90 > 0 ? formatMoney(r.saldo90) : "0.00",
        r.saldoMas90 > 0 ? formatMoney(r.saldoMas90) : "0.00",
        formatMoney(r.total),
        r.totalAbonado > 0 ? formatMoney(r.totalAbonado) : "0.00",
        formatMoney(r.saldoPendiente),
      ]);

      const footRow = [
        { content: `TOTALES (${clientSummaryRows.length} CLIENTES)`, styles: { halign: "left", fontStyle: "bold" } },
        { content: formatMoney(totals.saldo30), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.saldo60), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.saldo90), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.saldoMas90), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.totalFactura), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.totalAbonado), styles: { halign: "right", fontStyle: "bold" } },
        { content: formatMoney(totals.totalPendiente), styles: { halign: "right", fontStyle: "bold" } },
      ];

      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        foot: [footRow],
        startY: 25,
        margin: { left: 8, right: 8, top: 25, bottom: 10 },
        styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
        headStyles: { fillColor: [31, 23, 23], textColor: "white", fontSize: 8, fontStyle: "bold" },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold", fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 71, halign: "left" },
          1: { cellWidth: 30, halign: "right" },
          2: { cellWidth: 30, halign: "right" },
          3: { cellWidth: 30, halign: "right" },
          4: { cellWidth: 30, halign: "right" },
          5: { cellWidth: 30, halign: "right" },
          6: { cellWidth: 30, halign: "right" },
          7: { cellWidth: 30, halign: "right" },
        },
        didParseCell: (data) => {
          const colIdx = data.column.index;
          if (colIdx >= 1 && colIdx <= 7) {
            data.cell.styles.halign = "right";
          } else {
            data.cell.styles.halign = "left";
          }
        },
      });
    }

    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  };

  // ==========================================
  // EXPORTAR A EXCEL
  // ==========================================
  const handleExportExcel = () => {
    if (sortedFacturas.length === 0) return;

    const isSingleClient = selectedClient !== "todos";
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    const safeClientName = isSingleClient
      ? selectedClient.replace(/[/\\?%*:|"<>]/g, "_").trim()
      : "";
    const fileName = isSingleClient
      ? `Estado_de_Cuenta_${safeClientName}_${dateStr}.xlsx`
      : `Cuentas_por_Cobrar_General_${dateStr}.xlsx`;

    const sheetName = isSingleClient
      ? `Estado Cuenta`
      : "Cuentas por Cobrar";

    if (isSingleClient) {
      // Un solo cliente: exporta únicamente sus facturas por cobrar sin repetir la columna Cliente
      const excelColumns = [
        { key: "factura", header: "No. Factura", align: "center", width: 22 },
        { key: "fecha", header: "Fecha Emisión", align: "center", width: 16 },
        { key: "saldo30", header: "0 - 30 días", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "saldo60", header: "31 - 60 días", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "saldo90", header: "61 - 90 días", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "saldoMas90", header: "+90 días", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "total", header: "Total Factura", align: "right", numFmt: "#,##0.00", isTotal: true, width: 18 },
        { key: "totalAbonado", header: "Abonado", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "saldoPendiente", header: "Total que debe", align: "right", numFmt: "#,##0.00", isTotal: true, width: 18 },
      ];

      const excelData = sortedFacturas.map((f) => ({
        factura: String(f.Numero).startsWith("000-") ? f.Numero : `000-000-00-${f.Numero}`,
        fecha: (f.fecha_emision || f.created) ? formatDateDMY(f.fecha_emision || f.created) : "",
        saldo30: f.saldo30 || 0,
        saldo60: f.saldo60 || 0,
        saldo90: f.saldo90 || 0,
        saldoMas90: f.saldoMas90 || 0,
        total: f.total || 0,
        totalAbonado: f.totalAbonado || 0,
        saldoPendiente: f.saldoPendiente || 0,
      }));

      exportStyledExcel({
        fileName,
        sheetName,
        columns: excelColumns,
        data: excelData,
        includeTotals: true,
      });
    } else {
      // Todos los clientes: formato consolidado por cliente (sin No. Factura ni fecha)
      const excelColumns = [
        { key: "cliente", header: "Cliente", align: "left", width: 38 },
        { key: "saldo30", header: "0 - 30 días", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "saldo60", header: "31 - 60 días", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "saldo90", header: "61 - 90 días", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "saldoMas90", header: "+90 días", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "total", header: "Total Factura", align: "right", numFmt: "#,##0.00", isTotal: true, width: 18 },
        { key: "totalAbonado", header: "Abonado", align: "right", numFmt: "#,##0.00", isTotal: true, width: 16 },
        { key: "saldoPendiente", header: "Total que debe", align: "right", numFmt: "#,##0.00", isTotal: true, width: 18 },
      ];

      const excelData = clientSummaryRows.map((r) => ({
        cliente: r.cliente,
        saldo30: r.saldo30 || 0,
        saldo60: r.saldo60 || 0,
        saldo90: r.saldo90 || 0,
        saldoMas90: r.saldoMas90 || 0,
        total: r.total || 0,
        totalAbonado: r.totalAbonado || 0,
        saldoPendiente: r.saldoPendiente || 0,
      }));

      exportStyledExcel({
        fileName,
        sheetName,
        columns: excelColumns,
        data: excelData,
        includeTotals: true,
      });
    }
  };

  return (
    <div className={`app-card ${isModal ? "shadow-none border-0 m-0" : ""}`}>
      {/* Header del Card (si no es modal) */}
      {!isModal && (
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h5>
            <i className="bi bi-wallet2 me-2 text-primary"></i>
            Reporte de Cuentas por Cobrar
          </h5>
          <div className="d-flex align-items-center gap-2">
            {generatedAt && (
              <span className="small text-muted me-2">
                Actualizado: {generatedAt.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={fetchAllCreditos}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Actualizar datos
            </button>
          </div>
        </div>
      )}

      {/* Panel de Filtros Exhaustivos */}
      <div className="card-body bg-light-subtle border-bottom">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0 text-dark">
            <i className="bi bi-sliders me-2 text-primary"></i>
            Filtros del Reporte
          </h6>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
              onClick={handleResetFilters}
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Restablecer filtros
            </button>
          </div>
        </div>

        <div className="row g-3">
          {/* 1. Selector de Cliente */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold">
              <i className="bi bi-person me-1 text-primary"></i> Cliente específico
            </label>
            <select
              className="form-select form-select-sm"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="todos">Todos los clientes ({clientesList.length})</option>
              {clientesList.map((cli) => (
                <option key={cli} value={cli}>
                  {cli}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Búsqueda libre de cliente */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold">
              <i className="bi bi-search me-1 text-primary"></i> O buscar cliente por texto
            </label>
            <input
              type="text"
              className="form-control form-select-sm"
              placeholder="Ej: Distribuidora, Pérez..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              disabled={selectedClient !== "todos"}
            />
          </div>

          {/* 3. Búsqueda por # Factura u Observación */}
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold">
              <i className="bi bi-receipt me-1 text-primary"></i> # Factura u Observación
            </label>
            <input
              type="text"
              className="form-control form-select-sm"
              placeholder="Buscar # factura o nota..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
            />
          </div>

          {/* 4. Rango de Fechas */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold">Fecha emisión desde</label>
            <input
              type="date"
              className="form-control form-select-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold">Fecha emisión hasta</label>
            <input
              type="date"
              className="form-control form-select-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* 5. Presets rápidos de fecha */}
          <div className="col-12 col-md-6 d-flex align-items-end gap-1 flex-wrap">
            <span className="small text-muted me-1 mb-1">Accesos rápidos:</span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-1 px-2"
              onClick={() => handlePresetDate("all")}
            >
              Todo
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-1 px-2"
              onClick={() => handlePresetDate("thisMonth")}
            >
              Este mes
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-1 px-2"
              onClick={() => handlePresetDate("last30")}
            >
              Últimos 30d
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-1 px-2"
              onClick={() => handlePresetDate("thisYear")}
            >
              Este año
            </button>
          </div>

          {/* 6. Filtro por Antigüedad / Estado */}
          <div className="col-12 col-md-9">
            <label className="form-label small fw-semibold d-block">
              Estado de la cartera / Tramo de días
            </label>
            <div className="btn-group btn-group-sm flex-wrap w-100" role="group">
              <button
                type="button"
                className={`btn ${agingFilter === "pendientes" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setAgingFilter("pendientes")}
              >
                Solo pendientes ({normalizedList.filter((f) => (selectedClient === "todos" ? f.saldoPendiente > 0 : f.Cliente?.trim() === selectedClient && f.saldoPendiente > 0)).length})
              </button>
              <button
                type="button"
                className={`btn ${agingFilter === "30" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setAgingFilter("30")}
              >
                0 - 30d
              </button>
              <button
                type="button"
                className={`btn ${agingFilter === "60" ? "btn-warning" : "btn-outline-secondary"}`}
                onClick={() => setAgingFilter("60")}
              >
                31 - 60d
              </button>
              <button
                type="button"
                className={`btn ${agingFilter === "90" ? "btn-warning text-dark" : "btn-outline-secondary"}`}
                onClick={() => setAgingFilter("90")}
              >
                61 - 90d
              </button>
              <button
                type="button"
                className={`btn ${agingFilter === "mas90" ? "btn-danger" : "btn-outline-secondary"}`}
                onClick={() => setAgingFilter("mas90")}
              >
                +90d
              </button>
              {selectedClient === "todos" && (
                <button
                  type="button"
                  className={`btn ${agingFilter === "pagadas" ? "btn-outline-success" : "btn-outline-secondary"}`}
                  onClick={() => setAgingFilter("pagadas")}
                >
                  Pagadas
                </button>
              )}
              <button
                type="button"
                className={`btn ${agingFilter === "todas" ? "btn-dark" : "btn-outline-secondary"}`}
                onClick={() => setAgingFilter("todas")}
              >
                {selectedClient === "todos"
                  ? `Todas (${normalizedList.length})`
                  : `Todas las pendientes (${normalizedList.filter((f) => f.Cliente?.trim() === selectedClient && f.saldoPendiente > 0).length})`}
              </button>
            </div>
          </div>

          {/* 7. Monto mínimo */}
          <div className="col-12 col-md-3">
            <label className="form-label small fw-semibold">Saldo mín. (Lps.)</label>
            <input
              type="number"
              className="form-control form-select-sm"
              placeholder="0.00"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards del Reporte */}
      <div className="card-body border-bottom py-3">
        <div className="row g-2">
          <div className="col-6 col-md-3">
            <div className="stat-card py-2 px-3">
              <div className="stat-icon indigo" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-wallet2 fs-6"></i>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: "11px" }}>Total por cobrar</div>
                <div className="stat-value fs-6 text-danger">{money(totals.totalPendiente)}</div>
                <div className="small text-muted" style={{ fontSize: "10px" }}>
                  {totals.cantPendientes} facturas pendientes
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="stat-card py-2 px-3">
              <div className="stat-icon green" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-calendar-check fs-6"></i>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: "11px" }}>Hasta 30 días</div>
                <div className="stat-value fs-6 text-success">{money(totals.saldo30)}</div>
                <div className="small text-muted" style={{ fontSize: "10px" }}>Al día</div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="stat-card py-2 px-3">
              <div className="stat-icon amber" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-clock-history fs-6"></i>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: "11px" }}>31 a 90 días</div>
                <div className="stat-value fs-6 text-warning-emphasis">
                  {money(totals.saldo60 + totals.saldo90)}
                </div>
                <div className="small text-muted" style={{ fontSize: "10px" }}>
                  60d: {money(totals.saldo60)} | 90d: {money(totals.saldo90)}
                </div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="stat-card py-2 px-3">
              <div className="stat-icon red" style={{ width: "36px", height: "36px" }}>
                <i className="bi bi-exclamation-octagon fs-6"></i>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: "11px" }}>Más de 90 días</div>
                <div className="stat-value fs-6 text-danger">{money(totals.saldoMas90)}</div>
                <div className="small text-danger" style={{ fontSize: "10px" }}>Críticas / Vencidas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones y Exportaciones */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 pt-2 border-top">
          <div className="small text-muted">
            <i className="bi bi-info-circle me-1"></i>
            {getFilterDescription()} ({activeDataset.length} {selectedClient === "todos" ? (activeDataset.length === 1 ? "cliente" : "clientes") : (activeDataset.length === 1 ? "factura" : "facturas")})
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
              onClick={handleExportExcel}
              disabled={activeDataset.length === 0}
              title="Descargar este reporte exacto en Excel"
            >
              <i className="bi bi-file-earmark-excel"></i>
              <span>Exportar Excel</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
              onClick={handleExportPDF}
              disabled={activeDataset.length === 0}
              title="Abrir este reporte en PDF"
            >
              <i className="bi bi-file-earmark-pdf"></i>
              <span>Abrir PDF</span>
            </button>
            {isModal && onClose && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla del Reporte */}
      <div className="card-body p-0">
        {loading ? (
          <div className="empty-state py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Consultando cuentas por cobrar...</p>
          </div>
        ) : activeDataset.length === 0 ? (
          <div className="empty-state py-5">
            <i className="bi bi-check-all fs-1 text-success"></i>
            <h5>No hay resultados con estos filtros</h5>
            <p className="text-muted small">
              Ajusta o restablece los filtros para ver las cuentas por cobrar.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table-app">
              <thead>
                {selectedClient === "todos" ? (
                  <tr className="text-center align-middle">
                    <th scope="col" className="text-start" style={{ minWidth: "220px" }}>
                      Cliente
                    </th>
                    <th scope="col" className="text-end text-primary bg-primary-subtle" style={{ minWidth: "105px" }}>
                      0 - 30 días
                    </th>
                    <th scope="col" className="text-end text-warning-emphasis bg-warning-subtle" style={{ minWidth: "105px" }}>
                      31 - 60 días
                    </th>
                    <th scope="col" className="text-end text-danger-emphasis bg-warning-subtle bg-opacity-75" style={{ minWidth: "105px" }}>
                      61 - 90 días
                    </th>
                    <th scope="col" className="text-end text-danger bg-danger-subtle fw-bold" style={{ minWidth: "110px" }}>
                      +90 días
                    </th>
                    <th scope="col" className="text-end" style={{ minWidth: "110px" }}>Total Factura</th>
                    <th scope="col" className="text-end" style={{ minWidth: "100px" }}>Abonado</th>
                    <th scope="col" className="text-end fw-bold" style={{ minWidth: "115px" }}>Total que debe</th>
                  </tr>
                ) : (
                  <tr className="text-center align-middle">
                    <th scope="col" style={{ width: "135px" }}>No. Factura</th>
                    <th scope="col" style={{ width: "105px" }}>Emisión</th>
                    <th scope="col" className="text-end text-primary bg-primary-subtle" style={{ minWidth: "100px" }}>
                      0 - 30 días
                    </th>
                    <th scope="col" className="text-end text-warning-emphasis bg-warning-subtle" style={{ minWidth: "100px" }}>
                      31 - 60 días
                    </th>
                    <th scope="col" className="text-end text-danger-emphasis bg-warning-subtle bg-opacity-75" style={{ minWidth: "100px" }}>
                      61 - 90 días
                    </th>
                    <th scope="col" className="text-end text-danger bg-danger-subtle fw-bold" style={{ minWidth: "105px" }}>
                      +90 días
                    </th>
                    <th scope="col" className="text-end" style={{ minWidth: "105px" }}>Total Factura</th>
                    <th scope="col" className="text-end" style={{ minWidth: "95px" }}>Abonado</th>
                    <th scope="col" className="text-end fw-bold" style={{ minWidth: "110px" }}>Total que debe</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {selectedClient === "todos" ? (
                  paginatedRows.map((row) => (
                    <tr key={row.cliente} className="text-center align-middle">
                      <td className="text-start fw-semibold">
                        <div className="d-flex align-items-center justify-content-between">
                          <button
                            type="button"
                            className="btn btn-link text-start text-dark p-0 fw-semibold text-decoration-none"
                            onClick={() => setSelectedClient(row.cliente)}
                            title={`Hacer clic para ver solo las facturas de ${row.cliente}`}
                          >
                            <i className="bi bi-person-fill text-primary me-1"></i>
                            {row.cliente}
                          </button>
                          <span
                            className="badge bg-light text-secondary border fw-normal ms-2"
                            style={{ fontSize: "11px", cursor: "pointer" }}
                            onClick={() => setSelectedClient(row.cliente)}
                            title={`Ver ${row.cantFacturas} facturas por cobrar`}
                          >
                            {row.cantFacturas} {row.cantFacturas === 1 ? "factura" : "facturas"}
                          </span>
                        </div>
                      </td>
                      <td className={`text-end ${row.saldo30 > 0 ? "bg-primary-subtle bg-opacity-25 fw-bold text-primary" : "text-muted opacity-50"}`}>
                        {row.saldo30 > 0 ? formatMoney(row.saldo30) : "0.00"}
                      </td>
                      <td className={`text-end ${row.saldo60 > 0 ? "bg-warning-subtle bg-opacity-25 fw-bold text-warning-emphasis" : "text-muted opacity-50"}`}>
                        {row.saldo60 > 0 ? formatMoney(row.saldo60) : "0.00"}
                      </td>
                      <td className={`text-end ${row.saldo90 > 0 ? "bg-warning-subtle bg-opacity-50 fw-bold text-danger-emphasis" : "text-muted opacity-50"}`}>
                        {row.saldo90 > 0 ? formatMoney(row.saldo90) : "0.00"}
                      </td>
                      <td className={`text-end ${row.saldoMas90 > 0 ? "bg-danger-subtle bg-opacity-25 fw-bold text-danger" : "text-muted opacity-50"}`}>
                        {row.saldoMas90 > 0 ? formatMoney(row.saldoMas90) : "0.00"}
                      </td>
                      <td className="text-end fw-semibold">{formatMoney(row.total)}</td>
                      <td className="text-end text-success fw-medium">
                        {row.totalAbonado > 0 ? formatMoney(row.totalAbonado) : "0.00"}
                      </td>
                      <td className="text-end fw-bold">
                        <span className={row.saldoPendiente > 0 ? "text-dark" : "text-muted"}>
                          {formatMoney(row.saldoPendiente)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  paginatedRows.map((fac) => (
                    <tr key={fac.id} className="text-center align-middle">
                      <td className="fw-bold font-monospace">
                        000-000-00-{fac.Numero}
                      </td>
                      <td className="small text-muted">
                        {(fac.fecha_emision || fac.created) ? formatDateDMY(fac.fecha_emision || fac.created) : "—"}
                        <div className="text-muted" style={{ fontSize: "10px" }}>
                          ({fac.diasTranscurridos} {fac.diasTranscurridos === 1 ? "día" : "días"})
                        </div>
                      </td>
                      <td className={`text-end ${fac.saldo30 > 0 ? "bg-primary-subtle bg-opacity-25 fw-bold text-primary" : "text-muted opacity-50"}`}>
                        {fac.saldo30 > 0 ? formatMoney(fac.saldo30) : "0.00"}
                      </td>
                      <td className={`text-end ${fac.saldo60 > 0 ? "bg-warning-subtle bg-opacity-25 fw-bold text-warning-emphasis" : "text-muted opacity-50"}`}>
                        {fac.saldo60 > 0 ? formatMoney(fac.saldo60) : "0.00"}
                      </td>
                      <td className={`text-end ${fac.saldo90 > 0 ? "bg-warning-subtle bg-opacity-50 fw-bold text-danger-emphasis" : "text-muted opacity-50"}`}>
                        {fac.saldo90 > 0 ? formatMoney(fac.saldo90) : "0.00"}
                      </td>
                      <td className={`text-end ${fac.saldoMas90 > 0 ? "bg-danger-subtle bg-opacity-25 fw-bold text-danger" : "text-muted opacity-50"}`}>
                        {fac.saldoMas90 > 0 ? formatMoney(fac.saldoMas90) : "0.00"}
                      </td>
                      <td className="text-end fw-semibold">{formatMoney(fac.total)}</td>
                      <td className="text-end text-success fw-medium">
                        {fac.totalAbonado > 0 ? formatMoney(fac.totalAbonado) : "0.00"}
                      </td>
                      <td className="text-end fw-bold">
                        <span
                          className={
                            fac.saldoPendiente <= 0
                              ? "text-muted"
                              : fac.diasTranscurridos > 90
                              ? "text-danger"
                              : "text-dark"
                          }
                        >
                          {formatMoney(fac.saldoPendiente)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="table-light fw-bold">
                <tr className="text-center align-middle border-top">
                  <td colSpan={selectedClient === "todos" ? 1 : 2} className="text-end text-muted small pe-2">
                    TOTALES ({activeDataset.length} {selectedClient === "todos" ? (activeDataset.length === 1 ? "cliente" : "clientes") : (activeDataset.length === 1 ? "factura" : "facturas")}):
                  </td>
                  <td className="text-end text-primary bg-primary-subtle bg-opacity-25">
                    {formatMoney(totals.saldo30)}
                  </td>
                  <td className="text-end text-warning-emphasis bg-warning-subtle bg-opacity-25">
                    {formatMoney(totals.saldo60)}
                  </td>
                  <td className="text-end text-danger-emphasis bg-warning-subtle bg-opacity-50">
                    {formatMoney(totals.saldo90)}
                  </td>
                  <td className="text-end text-danger bg-danger-subtle bg-opacity-25">
                    {formatMoney(totals.saldoMas90)}
                  </td>
                  <td className="text-end fw-semibold">
                    {formatMoney(totals.totalFactura)}
                  </td>
                  <td className="text-end text-success">
                    {formatMoney(totals.totalAbonado)}
                  </td>
                  <td className="text-end fw-bold text-dark">
                    {formatMoney(totals.totalPendiente)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Paginación de 10 en 10 */}
        {activeDataset.length > PAGE_SIZE && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
            <span className="text-muted small">
              Mostrando {startIndex + 1} a {Math.min(startIndex + PAGE_SIZE, activeDataset.length)} de {activeDataset.length} {selectedClient === "todos" ? (activeDataset.length === 1 ? "cliente" : "clientes") : (activeDataset.length === 1 ? "factura" : "facturas")}
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <i className="bi bi-chevron-left me-1"></i> Anterior
              </button>
              <span className="btn btn-outline-secondary disabled text-dark">
                Pág. {currentPage} de {totalPages}
              </span>
              <button
                className="btn btn-outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente <i className="bi bi-chevron-right ms-1"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
