/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { getCategoryName } from "../utilities/categories";

export function ProductCount({
  product = null,
  id,
  Nombre,
  Precio,
  isOpen = false,
  onClose,
  listProducts = [],
}) {
  const { AddCart } = useContext(CartContext);

  // Resolve target product from props (either object product or legacy id + listProducts)
  const targetProduct = useMemo(() => {
    return (
      product ||
      listProducts.find((p) => p.id === id) ||
      (id ? { id, Nombre, Precio, Cantidad: 0 } : null)
    );
  }, [product, listProducts, id, Nombre, Precio]);

  const basePrice = useMemo(() => {
    if (!targetProduct) return 0;
    if (targetProduct.PrecioVentaEfectivo !== undefined) {
      return targetProduct.PrecioVentaEfectivo;
    }
    if (
      targetProduct.Precio_Venta !== undefined &&
      targetProduct.Precio_Venta !== null
    ) {
      return Number(targetProduct.Precio_Venta);
    }
    return Number(targetProduct.Precio || Precio || 0);
  }, [targetProduct, Precio]);

  const [cantidadV, setCantidadV] = useState(1);
  const [precioV, setPrecioV] = useState(basePrice);
  const [tipoImpuesto, setTipoImpuesto] = useState("15");
  const [descripcionV, setDescripcionV] = useState("");

  // Reset values when a new product is selected or modal opens
  useEffect(() => {
    if (targetProduct && isOpen) {
      setCantidadV(1);
      setPrecioV(basePrice);
      setTipoImpuesto("15");
      setDescripcionV(targetProduct.descripcion || "");
    }
  }, [targetProduct, basePrice, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetProduct) {
    return null;
  }

  const stockDisponible = Number(targetProduct.Cantidad || 0);
  const cantNum = Number(cantidadV);
  const precioNum = Number(precioV);
  const isOutOfStock = stockDisponible <= 0;
  const isExceedingStock = cantNum > stockDisponible;
  const isInvalidQuantity = isNaN(cantNum) || cantNum <= 0;
  const isInvalidPrice = isNaN(precioNum) || precioNum < 0;
  const canSubmit = !isOutOfStock && !isExceedingStock && !isInvalidQuantity && !isInvalidPrice;

  const handleAddToCart = (e) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    AddCart(
      targetProduct.id,
      targetProduct.Nombre,
      cantNum,
      precioNum,
      tipoImpuesto,
      descripcionV
    );

    if (onClose) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const isPriceModified = Math.abs(precioNum - basePrice) > 0.001;
  const subtotalItem = Math.max(0, cantNum || 0) * Math.max(0, precioNum || 0);

  return (
    <div
      className="modal show fade d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 1055 }}
      onClick={handleBackdropClick}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-light">
            <h5 className="modal-title fs-6 fw-bold text-dark d-flex align-items-center">
              <i className="bi bi-cart-plus me-2 text-primary"></i>
              Agregar producto a la venta
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleAddToCart}>
            <div className="modal-body p-4">
              {/* Product Info Card */}
              <div className="bg-light p-3 rounded mb-3 border">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <h6 className="fw-bold mb-1 text-dark fs-6">
                      {targetProduct.Nombre}
                    </h6>
                    <span className="badge bg-secondary-subtle text-secondary border fw-normal">
                      {getCategoryName(targetProduct)}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-muted small d-block" style={{ fontSize: "11px" }}>
                      Stock disponible
                    </span>
                    <span
                      className={`badge ${
                        stockDisponible <= 0
                          ? "bg-danger-subtle text-danger border border-danger-subtle"
                          : stockDisponible <= 5
                          ? "bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                          : "bg-success-subtle text-success border border-success-subtle"
                      } fs-6`}
                    >
                      {stockDisponible} un.
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="row g-3">
                {/* Cantidad Input */}
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-semibold small mb-1">
                    Cantidad a facturar
                  </label>
                  <div className="input-group">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setCantidadV((prev) => Math.max(1, Number(prev || 1) - 1))}
                      disabled={cantNum <= 1 || isOutOfStock}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={stockDisponible}
                      className={`form-control text-center fw-bold ${
                        isExceedingStock ? "is-invalid" : ""
                      }`}
                      value={cantidadV}
                      onChange={(e) => setCantidadV(e.target.value)}
                      disabled={isOutOfStock}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        setCantidadV((prev) =>
                          Math.min(stockDisponible, Number(prev || 0) + 1)
                        )
                      }
                      disabled={cantNum >= stockDisponible || isOutOfStock}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  {isExceedingStock && (
                    <div className="text-danger small mt-1" style={{ fontSize: "11.5px" }}>
                      Supera el stock ({stockDisponible} disp.)
                    </div>
                  )}
                </div>

                {/* Precio Unitario Input */}
                <div className="col-12 col-sm-6">
                  <label className="form-label fw-semibold small mb-1 d-flex justify-content-between align-items-center">
                    <span>Precio unitario</span>
                    {isPriceModified && (
                      <span
                        className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                        style={{ fontSize: "10px" }}
                      >
                        Personalizado
                      </span>
                    )}
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">L.</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control fw-bold text-end"
                      value={precioV}
                      onChange={(e) => setPrecioV(e.target.value)}
                    />
                  </div>
                  <div className="text-muted small mt-1" style={{ fontSize: "11px" }}>
                    Catálogo: L. {basePrice.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Descripción / Observación Input */}
                <div className="col-12">
                  <label className="form-label fw-semibold small mb-1">
                    Descripción / Observación (opcional)
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Detalle o nota específica para este producto..."
                    value={descripcionV}
                    onChange={(e) => setDescripcionV(e.target.value)}
                  />
                </div>
              </div>

              {/* Tax Selection */}
              <div className="mt-3">
                <label className="form-label fw-semibold small mb-1">
                  Tasa de impuesto (ISV)
                </label>
                <div className="btn-group btn-group-sm w-100" role="group">
                  <input
                    type="radio"
                    className="btn-check"
                    name="taxOptionModal"
                    id="modalTax15"
                    checked={tipoImpuesto === "15"}
                    onChange={() => setTipoImpuesto("15")}
                  />
                  <label
                    className="btn btn-outline-secondary btn-sm py-1"
                    htmlFor="modalTax15"
                  >
                    15%
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="taxOptionModal"
                    id="modalTax18"
                    checked={tipoImpuesto === "18"}
                    onChange={() => setTipoImpuesto("18")}
                  />
                  <label
                    className="btn btn-outline-secondary btn-sm py-1"
                    htmlFor="modalTax18"
                  >
                    18%
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="taxOptionModal"
                    id="modalTaxExento"
                    checked={tipoImpuesto === "exento"}
                    onChange={() => setTipoImpuesto("exento")}
                  />
                  <label
                    className="btn btn-outline-success btn-sm py-1"
                    htmlFor="modalTaxExento"
                  >
                    Exento
                  </label>

                  <input
                    type="radio"
                    className="btn-check"
                    name="taxOptionModal"
                    id="modalTaxExonerado"
                    checked={tipoImpuesto === "exonerado"}
                    onChange={() => setTipoImpuesto("exonerado")}
                  />
                  <label
                    className="btn btn-outline-primary btn-sm py-1"
                    htmlFor="modalTaxExonerado"
                  >
                    Exonerado
                  </label>
                </div>
              </div>

              {/* Subtotal Preview */}
              <div className="d-flex justify-content-between align-items-center mt-3 p-2 px-3 bg-light rounded border">
                <span className="fw-semibold text-muted small">Subtotal ítem:</span>
                <span className="fw-bold fs-6 text-primary">
                  L. {subtotalItem.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="modal-footer bg-light py-2 justify-content-between">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={!canSubmit}
              >
                <i className="bi bi-cart-plus me-1"></i>
                Agregar a la factura
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
