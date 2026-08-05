/* eslint-disable react/prop-types */
import { useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useData } from "../hooks/useData";

export function ProductCount({ id, Nombre, Precio }) {
  const { listProducts } = useData();
  const { AddCart } = useContext(CartContext);
  const [CantidadV, setCantidadV] = useState(0);

  const product = listProducts.find((prod) => prod.id === id);

  const SentToCart = () => {
    if (product && CantidadV > 0 && CantidadV <= product.Cantidad) {
      AddCart(id, Nombre, +CantidadV, Precio);
      alert("Se envió los datos al carrito");
      setCantidadV(0);
    } else if (CantidadV <= 0) {
      alert("Ingrese una cantidad mayor a cero.");
    } else {
      alert("La Cantidad de Productos en stock es insuficiente.");
    }
  };

  const inStock = product ? product.Cantidad : 0;

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body py-3">
        <div className="d-flex justify-content-between align-items-start">
          <div className="me-2">
            <div className="fw-bold fs-6">{Nombre || "Selecciona un producto"}</div>
            <div className="text-muted small">
              {Nombre ? `Stock disponible: ${inStock}` : "Haz clic en \"Vender\" en la lista"}
            </div>
          </div>
          {Nombre && (
            <div className="text-end">
              <div className="small text-muted">Precio</div>
              <div className="fw-bold text-primary">
                L. {Number(Precio || 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>
        <div className="input-group mt-3">
          <span className="input-group-text">
            <i className="bi bi-hash"></i>
          </span>
          <input
            type="number"
            min="0"
            max={inStock}
            className="form-control"
            placeholder="Cantidad a vender"
            value={CantidadV}
            onChange={(e) => setCantidadV(e.target.value)}
          />
          <button className="btn btn-app btn-primary-custom" onClick={SentToCart} disabled={!Nombre}>
            <i className="bi bi-cart-plus"></i>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
