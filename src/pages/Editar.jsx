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

  const hasSelection = Boolean(infoProduct.id);

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
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="app-card">
          <div className="card-header">
            <h5>
              <i className="bi bi-pencil-square me-2 text-primary"></i>
              Editar producto
            </h5>
          </div>
          <div className="card-body">
            {!hasSelection ? (
              <div className="empty-state">
                <i className="bi bi-arrow-left-circle"></i>
                <h5>Selecciona un producto</h5>
                <p>
                  Haz clic en <strong>Editar</strong> en la lista para cargar sus datos.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="editNombre" className="form-label">
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    id="editNombre"
                    className="form-control"
                    value={infoProduct.Nombre}
                    onChange={(e) =>
                      setInfoProduct({ ...infoProduct, Nombre: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="editCantidad" className="form-label">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    id="editCantidad"
                    min="0"
                    className="form-control"
                    value={infoProduct.Cantidad}
                    onChange={(e) =>
                      setInfoProduct({
                        ...infoProduct,
                        Cantidad: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="editPrecio" className="form-label">
                    Precio (Lps.)
                  </label>
                  <input
                    type="number"
                    id="editPrecio"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={infoProduct.Precio}
                    onChange={(e) =>
                      setInfoProduct({ ...infoProduct, Precio: e.target.value })
                    }
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-app btn-primary-custom flex-fill">
                    <i className="bi bi-check-lg"></i>
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={limpiarInput}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="app-card">
          <div className="card-header">
            <h5>
              <i className="bi bi-list-ul me-2 text-primary"></i>
              Inventario
            </h5>
            <span className="text-muted small">{listProducts.length} productos</span>
          </div>
          <div className="card-body p-0">
            <ListProducts
              list={listProducts}
              showButtons={true}
              handleSendProductData={handleSendProductData}
              scopeName="Editar producto"
              btnName="Editar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
