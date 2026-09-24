import { useState, useEffect, useCallback } from "react";
import { pb } from "../utilities/pocketbase_route";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import jsPDF from "jspdf";

const MySwal = withReactContent(Swal);

const money = (val) =>
  `L. ${Number(val || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

export default function Creditos() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("pendientes"); // "todas", "pendientes", "vencidas", "pagadas"

  const fetchCreditos = useCallback(async () => {
    setLoading(true);
    try {
      // Obtenemos facturas a crédito
      const records = await pb.collection("Facturas").getFullList({
        filter: 'condicion = "Credito"',
        sort: "-Numero",
      });
      setFacturas(records);
    } catch (err) {
      console.error("Error al cargar créditos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreditos();
  }, [fetchCreditos]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Normalizar datos de cada factura
  const normalizedList = facturas.map((f) => {
    const total = Number(f.Total || 0);
    const abonos = Array.isArray(f.abonos) ? f.abonos : [];
    const totalAbonado = abonos.reduce((sum, a) => sum + Number(a.monto || 0), 0);

    // Saldo pendiente: si está definido en el registro se usa, sino total - totalAbonado
    const saldoPendiente =
      f.saldo_pendiente !== undefined && f.saldo_pendiente !== null
        ? Number(f.saldo_pendiente)
        : Math.max(total - totalAbonado, 0);

    let fechaVenc = null;
    let esVencida = false;
    let diasRestantes = null;

    if (f.fecha_vencimiento) {
      fechaVenc = new Date(f.fecha_vencimiento + "T00:00:00");
    } else if (f.created) {
      // Si no tiene fecha_vencimiento explícita, calculamos 30 días desde created
      fechaVenc = new Date(f.created);
      fechaVenc.setDate(fechaVenc.getDate() + (Number(f.dias_credito) || 30));
    }

    if (fechaVenc && saldoPendiente > 0) {
      const diffTime = fechaVenc.getTime() - hoy.getTime();
      diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      esVencida = diasRestantes < 0;
    }

    let estado = f.estado_pago || (saldoPendiente === 0 ? "Pagada" : totalAbonado > 0 ? "Abonado" : "Pendiente");

    return {
      ...f,
      total,
      totalAbonado,
      saldoPendiente,
      abonos,
      fechaVenc,
      esVencida,
      diasRestantes,
      estado,
    };
  });

  // Métricas
  const totalPorCobrar = normalizedList.reduce((sum, f) => sum + f.saldoPendiente, 0);
  const totalCobrado = normalizedList.reduce((sum, f) => sum + f.totalAbonado, 0);
  const facturasPendientesCount = normalizedList.filter((f) => f.saldoPendiente > 0).length;
  const facturasVencidasCount = normalizedList.filter((f) => f.esVencida).length;

  // Filtrado
  const filteredFacturas = normalizedList.filter((f) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (f.Cliente && f.Cliente.toLowerCase().includes(term)) ||
      (f.Numero && String(f.Numero).includes(term)) ||
      (f.detalle && f.detalle.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterStatus === "pendientes") return f.saldoPendiente > 0;
    if (filterStatus === "vencidas") return f.esVencida;
    if (filterStatus === "pagadas") return f.saldoPendiente === 0;
    return true; // "todas"
  });

  // Registrar un abono
  const handleRegistrarAbono = async (factura) => {
    const saldoMax = factura.saldoPendiente;

    const { value: formValues } = await MySwal.fire({
      title: `Abonar a Factura #000-000-00-${factura.Numero}`,
      html: `
        <div class="text-start">
          <div class="p-3 bg-light rounded border mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted small">Cliente:</span>
              <span class="fw-bold">${factura.Cliente}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted small">Total de la Factura:</span>
              <span>${money(factura.total)}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted small">Saldo Pendiente:</span>
              <span class="fw-bold text-danger">${money(saldoMax)}</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold">Monto a abonar (Lps.) *</label>
            <input id="swal-abono-monto" type="number" step="0.01" max="${saldoMax}" min="0.01" class="form-control form-control-lg fw-bold text-success" placeholder="0.00" value="${saldoMax.toFixed(2)}" autofocus>
            <div class="form-text">Máximo a abonar: ${money(saldoMax)}</div>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold">Forma de pago *</label>
            <select id="swal-abono-forma" class="form-select">
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia bancaria</option>
              <option value="Deposito">Depósito</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold">Comprobante / Referencia (opcional)</label>
            <input id="swal-abono-ref" type="text" class="form-control" placeholder="Ej: Transf. BAC #892312">
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold">Nota u Observación (opcional)</label>
            <input id="swal-abono-nota" type="text" class="form-control" placeholder="Ej: Pago parcial acordado">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-cash-stack me-1"></i> Confirmar Abono',
      cancelButtonText: "Cancelar",
      focusConfirm: false,
      preConfirm: () => {
        const montoVal = Number(document.getElementById("swal-abono-monto").value);
        const formapago = document.getElementById("swal-abono-forma").value;
        const ref = document.getElementById("swal-abono-ref").value;
        const nota = document.getElementById("swal-abono-nota").value;

        if (!montoVal || montoVal <= 0) {
          Swal.showValidationMessage("Ingresa un monto válido mayor a cero");
          return false;
        }

        if (montoVal > saldoMax + 0.01) {
          Swal.showValidationMessage(`El monto no puede exceder el saldo pendiente (${money(saldoMax)})`);
          return false;
        }

        return {
          monto: montoVal,
          formapago,
          referencia: ref.trim(),
          nota: nota.trim(),
        };
      },
    });

    if (formValues) {
      try {
        const nuevoAbono = {
          id: `abn_${Date.now()}`,
          fecha: new Date().toISOString(),
          monto: formValues.monto,
          formapago: formValues.formapago,
          referencia: formValues.referencia,
          nota: formValues.nota,
        };

        const nuevosAbonos = [...factura.abonos, nuevoAbono];
        const nuevoSaldo = Math.max(saldoMax - formValues.monto, 0);
        const nuevoEstado = nuevoSaldo <= 0.009 ? "Pagada" : "Abonado";

        await pb.collection("Facturas").update(factura.id, {
          abonos: nuevosAbonos,
          saldo_pendiente: Math.round(nuevoSaldo * 100) / 100,
          estado_pago: nuevoEstado,
        });

        MySwal.fire({
          icon: "success",
          title: "Abono registrado",
          html: `
            <p>Se abonaron <b>${money(formValues.monto)}</b> a la factura <b>#000-000-00-${factura.Numero}</b>.</p>
            <p class="mb-0 text-muted small">Nuevo saldo pendiente: <b>${money(nuevoSaldo)}</b></p>
          `,
          showDenyButton: true,
          denyButtonText: '<i class="bi bi-printer me-1"></i> Imprimir Recibo',
          confirmButtonText: "Aceptar",
        }).then((result) => {
          if (result.isDenied) {
            imprimirRecibo(factura, nuevoAbono, nuevoSaldo);
          }
        });

        await fetchCreditos();
      } catch (err) {
        console.error("Error al registrar abono:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo registrar el abono: " + err.message,
        });
      }
    }
  };

  // Ver historial de abonos
  const handleVerHistorial = (factura) => {
    if (!factura.abonos || factura.abonos.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin abonos",
        text: "Esta factura no tiene abonos registrados todavía.",
      });
      return;
    }

    const rows = factura.abonos
      .map(
        (a, i) => `
        <tr class="align-middle text-start">
          <td class="text-center">${i + 1}</td>
          <td>${formatDateDMY(a.fecha)} ${new Date(a.fecha).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}</td>
          <td class="fw-bold text-success">${money(a.monto)}</td>
          <td><span class="badge bg-light text-dark border">${a.formapago || "Efectivo"}</span></td>
          <td><small class="text-muted">${a.referencia || "—"}</small></td>
        </tr>
      `
      )
      .join("");

    MySwal.fire({
      title: `Historial de Abonos - Fac. #${factura.Numero}`,
      html: `
        <div class="text-start mb-2">
          <span class="text-muted small">Cliente:</span> <b>${factura.Cliente}</b> | 
          <span class="text-muted small">Total:</span> <b>${money(factura.total)}</b> | 
          <span class="text-muted small">Saldo:</span> <b class="text-danger">${money(factura.saldoPendiente)}</b>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-bordered">
            <thead class="table-light text-center small">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Forma de Pago</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody class="small">
              ${rows}
            </tbody>
          </table>
        </div>
      `,
      width: "600px",
      confirmButtonText: "Cerrar",
    });
  };

  // Generar Recibo de Abono en PDF
  const imprimirRecibo = (factura, abono, nuevoSaldo) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [140, 150], // Formato de recibo de caja compacto
      });

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("RECIBO DE PAGO / ABONO", 70, 15, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha: ${formatDateDMY(abono.fecha)}`, 14, 25);
      doc.text(`Recibo Ref: ${abono.id || "—"}`, 14, 30);
      doc.text(`Factura aplicada: 000-000-00-${factura.Numero}`, 14, 35);
      doc.text(`Cliente: ${factura.Cliente}`, 14, 40);

      doc.setDrawColor(200);
      doc.line(14, 45, 126, 45);

      doc.setFontSize(10);
      doc.text("Detalle del Abono", 14, 52);

      doc.setFontSize(9);
      doc.text(`Forma de pago: ${abono.formapago || "Efectivo"}`, 14, 60);
      if (abono.referencia) {
        doc.text(`Referencia: ${abono.referencia}`, 14, 66);
      }
      if (abono.nota) {
        doc.text(`Nota: ${abono.nota}`, 14, 72);
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Monto Abonado: ${money(abono.monto)}`, 14, 82);

      doc.setDrawColor(200);
      doc.line(14, 87, 126, 87);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Factura: ${money(factura.total)}`, 14, 94);
      doc.text(`Saldo Restante: ${money(nuevoSaldo)}`, 14, 100);

      doc.setFontSize(8);
      doc.text("Firma de Recibido: _______________________", 70, 125, { align: "center" });
      doc.text("Gracias por su pago", 70, 133, { align: "center" });

      const blob = doc.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
    } catch (e) {
      console.error("Error al generar recibo PDF:", e);
      alert("No se pudo generar el recibo PDF");
    }
  };

  return (
    <>
      {/* Tarjetas de métricas superiores */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon red">
              <i className="bi bi-wallet2"></i>
            </div>
            <div>
              <div className="stat-label">Total por cobrar</div>
              <div className="stat-value">{money(totalPorCobrar)}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon amber">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div>
              <div className="stat-label">Facturas pendientes</div>
              <div className="stat-value">{facturasPendientesCount}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon red">
              <i className="bi bi-calendar-x"></i>
            </div>
            <div>
              <div className="stat-label">Facturas vencidas</div>
              <div className="stat-value text-danger">{facturasVencidasCount}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon green">
              <i className="bi bi-check-circle"></i>
            </div>
            <div>
              <div className="stat-label">Total recuperado</div>
              <div className="stat-value text-success">{money(totalCobrado)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta principal con tabla */}
      <div className="app-card">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h5>
            <i className="bi bi-journal-text me-2 text-primary"></i>
            Cuentas por Cobrar (Facturas al Crédito)
          </h5>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={fetchCreditos}
              title="Refrescar créditos"
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Actualizar
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Barra de Filtros y Búsqueda */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por cliente, # factura o detalle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-md-6 d-flex gap-1 justify-content-md-end flex-wrap">
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === "pendientes" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setFilterStatus("pendientes")}
              >
                Pendientes ({facturasPendientesCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === "vencidas" ? "btn-danger" : "btn-outline-secondary"}`}
                onClick={() => setFilterStatus("vencidas")}
              >
                Vencidas ({facturasVencidasCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === "pagadas" ? "btn-success" : "btn-outline-secondary"}`}
                onClick={() => setFilterStatus("pagadas")}
              >
                Pagadas
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterStatus === "todas" ? "btn-secondary" : "btn-outline-secondary"}`}
                onClick={() => setFilterStatus("todas")}
              >
                Todas ({normalizedList.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Cargando créditos...</p>
            </div>
          ) : filteredFacturas.length === 0 ? (
            <div className="empty-state py-5">
              <i className="bi bi-check-all fs-1 text-success"></i>
              <h5>No hay facturas en este criterio</h5>
              <p className="text-muted small">
                {searchTerm
                  ? "No se encontraron facturas con ese término de búsqueda."
                  : "No hay facturas al crédito registradas o pendientes en esta categoría."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-app">
                <thead>
                  <tr className="text-center align-middle">
                    <th scope="col"># Factura</th>
                    <th scope="col" className="text-start">Cliente</th>
                    <th scope="col">Emisión</th>
                    <th scope="col">Vencimiento</th>
                    <th scope="col">Total</th>
                    <th scope="col">Abonado</th>
                    <th scope="col">Saldo Pendiente</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacturas.map((fac) => {
                    const isPaid = fac.saldoPendiente <= 0;
                    return (
                      <tr key={fac.id} className="text-center align-middle">
                        <td className="fw-bold font-monospace">
                          000-000-00-{fac.Numero}
                        </td>
                        <td className="text-start fw-medium">
                          {fac.Cliente}
                          {fac.observacion && (
                            <div className="text-muted small" style={{ fontSize: "11px" }}>
                              <i className="bi bi-tag me-1"></i>
                              {fac.observacion}
                            </div>
                          )}
                        </td>
                        <td className="small text-muted">
                          {fac.created ? formatDateDMY(fac.created) : "—"}
                        </td>
                        <td>
                          {fac.fechaVenc ? (
                            <div>
                              <div className="small fw-semibold">
                                {formatDateDMY(fac.fechaVenc)}
                              </div>
                              {!isPaid && (
                                <span
                                  className={`badge ${
                                    fac.esVencida
                                      ? "bg-danger"
                                      : fac.diasRestantes <= 5
                                      ? "bg-warning text-dark"
                                      : "bg-light text-dark border"
                                  } small`}
                                  style={{ fontSize: "10.5px" }}
                                >
                                  {fac.esVencida
                                    ? `Vencida (${Math.abs(fac.diasRestantes)}d)`
                                    : `${fac.diasRestantes} días`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td className="fw-semibold">{money(fac.total)}</td>
                        <td className="text-success fw-medium">
                          {fac.totalAbonado > 0 ? money(fac.totalAbonado) : "—"}
                        </td>
                        <td className="fw-bold">
                          <span
                            className={
                              isPaid
                                ? "text-muted"
                                : fac.esVencida
                                ? "text-danger"
                                : "text-dark"
                            }
                          >
                            {money(fac.saldoPendiente)}
                          </span>
                        </td>
                        <td>
                          {isPaid ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              <i className="bi bi-check-circle me-1"></i> Pagada
                            </span>
                          ) : fac.totalAbonado > 0 ? (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                              <i className="bi bi-pie-chart me-1"></i> Abonado
                            </span>
                          ) : fac.esVencida ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                              <i className="bi bi-exclamation-triangle me-1"></i> Vencida
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                              <i className="bi bi-hourglass me-1"></i> Pendiente
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex justify-content-center align-items-center gap-1">
                            {!isPaid && (
                              <button
                                type="button"
                                className="btn btn-sm btn-primary-custom d-flex align-items-center gap-1"
                                onClick={() => handleRegistrarAbono(fac)}
                                title="Registrar abono de dinero"
                              >
                                <i className="bi bi-cash-stack"></i>
                                <span>Abonar</span>
                              </button>
                            )}

                            {fac.abonos && fac.abonos.length > 0 && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleVerHistorial(fac)}
                                title="Ver historial de abonos"
                              >
                                <i className="bi bi-clock-history"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
