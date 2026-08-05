/* eslint-disable react/prop-types */
const stockBadge = (cantidad) => {
  if (!cantidad || cantidad <= 0) {
    return (
      <span className="badge-stock out">
        <span className="dot"></span>
        Agotado
      </span>
    );
  }
  if (cantidad <= 5) {
    return (
      <span className="badge-stock low">
        <span className="dot"></span>
        {cantidad} (bajo)
      </span>
    );
  }
  return (
    <span className="badge-stock ok">
      <span className="dot"></span>
      {cantidad}
    </span>
  );
};

export const ListProducts = ({
  list,
  showButtons,
  handleSendProductData,
  scopeName = "Agregar a la venta",
  btnName = "Vender",
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">Cargando productos...</p>
      </div>
    );
  }

  if (!list || list.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-inbox"></i>
        <h5>No hay productos en la lista</h5>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table-app">
        <thead>
          <tr className="text-center">
            <th scope="col">#</th>
            <th scope="col">Nombre</th>
            <th scope="col">Stock</th>
            <th scope="col">Precio</th>
            {showButtons && <th scope="col">{scopeName}</th>}
          </tr>
        </thead>
        <tbody>
          {list.map((product, index) => (
            <tr className="text-center" key={product.id}>
              <td>{index + 1}</td>
              <td className="text-start fw-medium">{product.Nombre}</td>
              <td>{stockBadge(product.Cantidad)}</td>
              <td className="fw-semibold">
                L. {Number(product.Precio || 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
              </td>
              {showButtons && (
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleSendProductData(product)}
                    disabled={!product.Cantidad || product.Cantidad <= 0}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    {btnName}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
