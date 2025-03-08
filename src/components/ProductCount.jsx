import { useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useData } from "../hooks/useData";

export function ProductCount({ id, Nombre, Precio }) {
  const { listProducts } = useData();
  const { AddCart } = useContext(CartContext);
  const [CantidadV, setCantidadV] = useState(0);

  const product = listProducts.find((Nombre) => Nombre.id === id);

  const SentToCart = () => {
    if (product && CantidadV <= product.Cantidad) {
      AddCart(id, Nombre, +CantidadV, Precio);
      alert("Se envió los datos al carrito");
      setCantidadV(0);
    } else {
      alert("La Cantidad de Productos en stock es insuficiente.");
    }
  };

  return (
    <>
      <div className="card w-50 mx-auto my-2 text-center">
        <div className="card-body">
          <div className="input-group mb-3">
            <span className="input-group-text mx-auto fs-6">
              {Nombre ? Nombre : "No se ha agregado"}
            </span>
          </div>
          <div className="input-group mb-3">
            <span className="input-group-text">Cantidad a vender:</span>
            <input
              type="number"
              min={"0"}
              onChange={(e) => {
                setCantidadV(e.target.value);
              }}
              className="form-control"
              placeholder="15..."
              value={CantidadV}
            />
          </div>
          <button className="btn btn-primary" onClick={SentToCart}>
            Mandar al carrito
          </button>
        </div>
      </div>
    </>
  );
}
