import { useState } from "react";
import { useData } from "../hooks/index";
import { ListProducts } from "../components";
import { useUpdateData } from "../hooks/index";

export default function Editar() {
  const { listProducts } = useData();
  const { updateData } = useUpdateData();
  const [infoProduct, setInfoProduct] = useState({
    id: "",
    Nombre: "",
    Cantidad: 0,
    Precio: 0,
  });

  const limpiarInput = () => {
    setInfoProduct({
      id: "",
      Nombre: "",
      Cantidad: 0,
      Precio: 0,
    });
  };

  const handleSendProductData = (data) => {
    setInfoProduct({
      id: data.id,
      Nombre: data.Nombre,
      Cantidad: Number(data.Cantidad),
      Precio: data.Precio,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateData(infoProduct, limpiarInput);
  };

  return (
    <main className="container">
      <div className="card text-center">
        <div className="card-body">
          <div className="input-group mb-3">
            <label
              htmlFor="text"
              className="input-group-text"
              id="basic-addon1"
            >
              Nombre del Nombre:
            </label>
            <input
              type="text"
              name="Nombre"
              onChange={(e) =>
                setInfoProduct({ ...infoProduct, Nombre: e.target.value })
              }
              className="form-control"
              value={infoProduct.Nombre}
            />
          </div>
          <div className="input-group mb-3">
            <label
              htmlFor="number"
              className="input-group-text"
              id="basic-addon1"
            >
              Cantidad:
            </label>
            <input
              type="number"
              name="Cantidad"
              onChange={(e) =>
                setInfoProduct({
                  ...infoProduct,
                  Cantidad: Number(e.target.value),
                })
              }
              className="form-control"
              value={infoProduct.Cantidad}
            />
          </div>
          <div className="input-group mb-3">
            <label
              htmlFor="number"
              className="input-group-text"
              id="basic-addon1"
            >
              Precio:
            </label>
            <input
              type="number"
              name="Precio"
              onChange={(e) =>
                setInfoProduct({ ...infoProduct, Precio: e.target.value })
              }
              className="form-control"
              value={infoProduct.Precio}
            />
          </div>
        </div>
        <div className="card-footer text-body-secondary">
          <div>
            <button
              type="submit"
              className="btn btn-success m-2"
              onClick={handleSubmit}
            >
              Editar
            </button>
          </div>
        </div>
      </div>
      <ListProducts
        list={listProducts}
        showButtons={true}
        handleSendProductData={handleSendProductData}
        scopeName="Editar Nombre"
        btnName="Editar"
      />
    </main>
  );
}
