import { useContext } from "react";
import { CheckBoxNumber, CheckBoxText } from "../components";
import { CartContext } from "../context/CartContext";
import useFacturarState from "../hooks/useFacturarState";
import useFacturarOperations from "../hooks/useFacturarOperations";
import Suelto from "../components/Suelto";

const money = (value) =>
  `L. ${Number(value || 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

export default function Facturar() {
  const { cart } = useContext(CartContext);
  const {
    state,
    handleCliente,
    handleCantidad,
    handleCondicion,
    handleFormapago,
    handleDetalle,
    handleObservacion,
  } = useFacturarState();

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
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((prod) => (
                      <tr className="text-center" key={prod.id}>
                        <td className="text-start fw-medium">{prod.Nombre}</td>
                        <td>{prod.Cantidad}</td>
                        <td>{money(prod.Precio)}</td>
                        <td className="fw-semibold">{money(prod.Cantidad * prod.Precio)}</td>
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

      <div className="row g-4">
        <div className="col-md-6">
          <div className="app-card h-100">
            <div className="card-header">
              <h5>
                <i className="bi bi-person me-2 text-primary"></i>
                Datos del cliente
              </h5>
            </div>
            <div className="card-body">
              <CheckBoxText
                tipo={"Nombre del cliente"}
                onTextoChange={handleCliente}
              />
              {state.Cliente && (
                <p className="text-muted small mb-0">
                  <i className="bi bi-person-check me-1"></i>
                  {state.Cliente}
                </p>
              )}
              <hr />
              <CheckBoxNumber
                name={"RTN del cliente"}
                onCantidadChange={handleCantidad}
                tipo={"rtnCliente"}
              />
              {state.cantidades.rtnCliente > 0 && (
                <p className="text-muted small mb-0">
                  <i className="bi bi-card-text me-1"></i>
                  {state.cantidades.rtnCliente}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="app-card h-100">
            <div className="card-header">
              <h5>
                <i className="bi bi-credit-card me-2 text-primary"></i>
                Condiciones de pago
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
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
              <div className="mb-3">
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
              <div className="mb-3">
                <label className="form-label">Detalle (banco o referencia)</label>
                <input
                  type="text"
                  className="form-control"
                  value={state.detalle}
                  onChange={(e) => handleDetalle(e.target.value)}
                  placeholder="Ej: Banco ATLANTIDA / Comprobante"
                />
              </div>
              <div className="mb-0">
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
      </div>

      <div className="app-card mt-4">
        <div className="card-header">
          <h5>
            <i className="bi bi-sliders me-2 text-primary"></i>
            Impuestos y descuentos
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-6 col-lg-3">
              <CheckBoxNumber
                name={"Gravado 18%"}
                onCantidadChange={handleCantidad}
                tipo={"cantidadGravado18"}
              />
            </div>
            <div className="col-md-6 col-lg-3">
              <CheckBoxNumber
                name={"Descuento"}
                onCantidadChange={handleCantidad}
                tipo={"cantidadDescuento"}
              />
            </div>
            <div className="col-md-6 col-lg-3">
              <CheckBoxNumber
                name={"Exonerado"}
                onCantidadChange={handleCantidad}
                tipo={"cantidadExonerado"}
              />
            </div>
            <div className="col-md-6 col-lg-3">
              <CheckBoxNumber
                name={"Exento"}
                onCantidadChange={handleCantidad}
                tipo={"cantidadExento"}
              />
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
                <span>{money(breakdown.base18)}</span>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">ISV 18%</span>
                <span>{money(breakdown.isv18)}</span>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">Exento</span>
                <span>{money(breakdown.exento)}</span>
              </div>
              <div className="mb-1 d-flex justify-content-between">
                <span className="text-muted">Exonerado</span>
                <span>{money(breakdown.exonerado)}</span>
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

          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <Suelto totalFactura={totalFactura} />
            </div>
            <div className="col-md-6 text-md-end">
              <button
                className="btn btn-app btn-primary-custom w-100"
                onClick={handleClick}
                disabled={cart.length === 0}
              >
                <i className="bi bi-check2-circle"></i>
                Facturar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
