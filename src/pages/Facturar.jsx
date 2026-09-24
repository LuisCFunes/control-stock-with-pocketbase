/* eslint-disable react/prop-types */
import { useContext } from "react";
import { CheckBoxNumber } from "../components";
import { CartContext } from "../context/CartContext";
import useFacturarState from "../hooks/useFacturarState";
import useFacturarOperations from "../hooks/useFacturarOperations";

const money = (value) =>
  `L. ${Number(value || 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

export default function Facturar({ facturarState: externalFacturarState }) {
  const { cart, toggleExento, setProductTax, removeFromCart } = useContext(CartContext);
  const internalFacturarState = useFacturarState();
  const facturarState = externalFacturarState || internalFacturarState;

  const {
    state,
    handleCantidad,
    handleCondicion,
    handleFormapago,
    handleDetalle,
    handleObservacion,
    handleDiasCredito,
  } = facturarState;

  const { handleClick, totalFactura, totalWords, breakdown } =
    useFacturarOperations(state);

  const cartTotal = cart.reduce((acc, prod) => acc + prod.Cantidad * prod.Precio, 0);

  return (
    <>
      <div className="app-card mb-4">
        <div className="card-header">
          <h5>
            <i className="bi bi-cart3 me-2 text-primary"></i>
            Carrito de compra
          </h5>
          <span className="badge bg-primary">{cart.length} artículos</span>
        </div>
        <div className="card-body p-0">
          {cart.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-bag-plus"></i>
              <h5>El carrito está vacío</h5>
              <p>Agrega productos desde la lista para comenzar la venta.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table-app">
                  <thead>
                    <tr className="text-center">
                      <th scope="col">Producto</th>
                      <th scope="col">Cant.</th>
                      <th scope="col">Precio</th>
                      <th scope="col" style={{ width: "115px" }}>Tasa ISV</th>
                      <th scope="col">Total</th>
                      <th scope="col" style={{ width: "40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((prod) => (
                      <tr className="text-center align-middle" key={prod.id}>
                        <td className="text-start fw-medium">
                          {prod.Nombre}
                          {prod.tipoImpuesto === "exonerado" || prod.exonerado ? (
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2 small">
                              Exonerado
                            </span>
                          ) : prod.tipoImpuesto === "exento" || prod.exento ? (
                            <span className="badge bg-success-subtle text-success border border-success-subtle ms-2 small">
                              Exento
                            </span>
                          ) : prod.tipoImpuesto === "18" ? (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle ms-2 small">
                              18% ISV
                            </span>
                          ) : null}
                        </td>
                        <td>{prod.Cantidad}</td>
                        <td>{money(prod.Precio)}</td>
                        <td>
                          <select
                            className="form-select form-select-sm py-1 px-2 text-center"
                            style={{ fontSize: "12px", width: "105px", margin: "0 auto" }}
                            value={
                              prod.tipoImpuesto ||
                              (prod.exento ? "exento" : prod.exonerado ? "exonerado" : "15")
                            }
                            onChange={(e) => setProductTax && setProductTax(prod.id, e.target.value)}
                            title="Selecciona la tasa de impuesto para este producto"
                          >
                            <option value="15">15%</option>
                            <option value="18">18%</option>
                            <option value="exento">Exento</option>
                            <option value="exonerado">Exonerado</option>
                          </select>
                        </td>
                        <td className="fw-semibold">{money(prod.Cantidad * prod.Precio)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-0"
                            onClick={() => removeFromCart && removeFromCart(prod.id)}
                            title="Eliminar del carrito"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-light border-top">
                <span className="fw-semibold">Subtotal</span>
                <span className="fw-bold fs-6">{money(cartTotal)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Condiciones de pago */}
      <div className="app-card mb-4">
        <div className="card-header">
          <h5>
            <i className="bi bi-credit-card me-2 text-primary"></i>
            Condiciones de pago
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Condición</label>
              <select
                className="form-select"
                value={state.condicion}
                onChange={(e) => {
                  handleCondicion(e.target.value);
                  if (e.target.value === "Credito") {
                    handleFormapago("");
                  }
                }}
              >
                <option value="Contado">Contado</option>
                <option value="Credito">Credito</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Forma de pago</label>
              <select
                className="form-select"
                value={state.formapago}
                disabled={state.condicion === "Credito"}
                onChange={(e) => handleFormapago(e.target.value)}
              >
                <option value="">—</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>

            {state.condicion === "Credito" && (
              <div className="col-12">
                <div className="p-3 bg-light border rounded">
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-sm-6">
                      <label className="form-label small fw-bold text-dark mb-1">
                        <i className="bi bi-calendar-range me-1 text-primary"></i>
                        Plazo del Crédito
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={state.diasCredito || 30}
                        onChange={(e) => handleDiasCredito && handleDiasCredito(e.target.value)}
                      >
                        <option value="15">15 días</option>
                        <option value="30">30 días (1 mes)</option>
                        <option value="45">45 días</option>
                        <option value="60">60 días (2 meses)</option>
                        <option value="90">90 días (3 meses)</option>
                      </select>
                    </div>
                    <div className="col-12 col-sm-6">
                      <div className="small text-muted mb-1">Fecha de vencimiento:</div>
                      <div className="fw-semibold small text-primary">
                        <i className="bi bi-calendar-check me-1"></i>
                        {(() => {
                          const d = new Date();
                          d.setDate(d.getDate() + (Number(state.diasCredito) || 30));
                          const day = String(d.getDate()).padStart(2, "0");
                          const month = String(d.getMonth() + 1).padStart(2, "0");
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()}
                      </div>
                    </div>
                  </div>
                  {state.Cliente === "Consumidor Final" && (
                    <div className="text-warning-emphasis small mt-2 d-flex align-items-center" style={{ fontSize: "12px" }}>
                      <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                      <span>
                        Atención: Estás emitiendo a crédito con <strong>Consumidor Final</strong>. Te sugerimos seleccionar un cliente específico.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="col-12 col-md-6">
              <label className="form-label">Detalle (banco o referencia)</label>
              <input
                type="text"
                className="form-control"
                value={state.detalle}
                onChange={(e) => handleDetalle(e.target.value)}
                placeholder="Ej: Banco ATLANTIDA / Comprobante"
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label">Observación (OP)</label>
              <input
                type="text"
                className="form-control"
                value={state.observacion}
                onChange={(e) => handleObservacion(e.target.value)}
                placeholder="Ej: OP 031387"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="app-card mt-4">
        <div className="card-header">
          <h5>
            <i className="bi bi-sliders me-2 text-primary"></i>
            Descuentos
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <CheckBoxNumber
                name={"Descuento"}
                onCantidadChange={handleCantidad}
                tipo={"cantidadDescuento"}
              />
            </div>
            <div className="col-12 col-md-6 text-muted small">
              <i className="bi bi-info-circle me-1 text-primary"></i>
              Los impuestos (15%, 18%), importes exentos y exonerados se calculan automáticamente según la tasa de cada producto en el carrito.
            </div>
          </div>
        </div>
      </div>

      <div className="app-card mt-4">
        <div className="card-header">
          <h5>
            <i className="bi bi-receipt me-2 text-primary"></i>
            Resumen de la factura
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-lg-6">
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">Subtotal (carrito)</span>
                <span>{money(breakdown.subTotal)}</span>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">Base gravada 15%</span>
                <span>{money(breakdown.base15)}</span>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">ISV 15%</span>
                <span>{money(breakdown.isv15)}</span>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">Base gravada 18%</span>
                <span className={breakdown.base18 > 0 ? "fw-bold text-danger" : ""}>{money(breakdown.base18)}</span>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">ISV 18%</span>
                <span className={breakdown.isv18 > 0 ? "fw-bold text-danger" : ""}>{money(breakdown.isv18)}</span>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">Exento</span>
                <span>{money(breakdown.exento)}</span>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">Exonerado</span>
                <span className={breakdown.exonerado > 0 ? "fw-bold text-primary" : ""}>
                  {money(breakdown.exonerado)}
                </span>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">Descuento</span>
                <span className="text-danger">−{money(breakdown.descuento)}</span>
              </div>
              <div className="border-top mt-2 pt-2 d-flex justify-content-between align-items-center">
                <span className="fw-bold">TOTAL</span>
                <span className="total-amount">{money(totalFactura)}</span>
              </div>
            </div>
          </div>

          <p className="text-muted small mt-3 mb-4">
            <i className="bi bi-info-circle me-1"></i>
            Son: <strong>{totalWords}</strong>
          </p>

          <div className="mt-4">
            <button
              className="btn btn-app btn-primary-custom w-100 py-3 fs-5"
              onClick={handleClick}
              disabled={cart.length === 0}
            >
              <i className="bi bi-check2-circle me-2"></i>
              Facturar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
