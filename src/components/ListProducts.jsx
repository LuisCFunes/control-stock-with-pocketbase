/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { getCategoryName } from "../utilities/categories";

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
  list = [],
  showButtons,
  handleSendProductData,
  onDeleteProduct,
  scopeName = "Acción",
  btnName = "Vender",
  loading = false,
  isInitialState = false,
  onShowAll,
  itemsPerPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when the list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [list]);

  if (loading) {
    return (
      <div className="empty-state py-4">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Cargando productos...</p>
      </div>
    );
  }

  // Estado inicial antes de aplicar filtros
  if (isInitialState) {
    return (
      <div className="empty-state py-5">
        <div
          className="stat-icon indigo mx-auto mb-3"
          style={{ width: 48, height: 48, fontSize: 22 }}
        >
          <i className="bi bi-funnel"></i>
        </div>
        <h5 className="fw-bold">Filtra los productos para comenzar</h5>
        <p className="text-muted small mb-3">
          Selecciona una categoría, busca por nombre o usa los filtros para ver productos.
        </p>
        {onShowAll && (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={onShowAll}
          >
            <i className="bi bi-eye me-1"></i> Ver todos los productos
          </button>
        )}
      </div>
    );
  }

  if (!list || list.length === 0) {
    return (
      <div className="empty-state py-4">
        <i className="bi bi-inbox"></i>
        <h5>No hay productos en la lista</h5>
        <p className="text-muted small">No se encontraron productos con los filtros aplicados.</p>
      </div>
    );
  }

  // Paginación de 10 en 10
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedList = list.slice(startIndex, endIndex);

  return (
    <div>
      <div className="table-responsive">
        <table className="table-app">
          <thead>
            <tr className="text-center">
              <th scope="col" style={{ width: "40px" }}>#</th>
              <th scope="col">Nombre</th>
              <th scope="col">Categoría</th>
              <th scope="col">Stock</th>
              <th scope="col">P. Compra</th>
              <th scope="col">P. Venta</th>
              {(showButtons || onDeleteProduct) && <th scope="col">{scopeName}</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedList.map((product, index) => {
              const category = getCategoryName(product);
              return (
                <tr className="text-center" key={product.id}>
                  <td>{startIndex + index + 1}</td>
                  <td className="text-start fw-medium">{product.Nombre}</td>
                  <td>
                    <span className="badge bg-light text-secondary border fw-normal">
                      {category}
                    </span>
                  </td>
                  <td>{stockBadge(product.Cantidad)}</td>
                  <td className="text-muted">
                    L. {Number(product.Precio_Compra || 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="fw-semibold text-primary">
                    L. {Number(product.Precio_Venta ?? product.Precio ?? 0).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
                  </td>
                  {(showButtons || onDeleteProduct) && (
                    <td>
                      <div className="d-flex justify-content-center align-items-center gap-1">
                        {showButtons && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleSendProductData(product)}
                            disabled={btnName !== "Editar" && (!product.Cantidad || product.Cantidad <= 0)}
                            title={btnName}
                          >
                            <i className={`bi ${btnName === "Editar" ? "bi-pencil-square" : "bi-plus-lg"} me-1`}></i>
                            {btnName}
                          </button>
                        )}
                        {onDeleteProduct && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onDeleteProduct(product)}
                            title={`Eliminar ${product.Nombre}`}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Barra de paginación y conteo (listas de 10) */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 border-top bg-light-subtle">
        <span className="text-muted small">
          Mostrando <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> de{" "}
          <strong>{totalItems}</strong> productos
        </span>

        {totalPages > 1 && (
          <nav aria-label="Navegación de productos">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${safePage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Anterior"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const hasGap = prevPage && page - prevPage > 1;

                  return (
                    <span key={page} className="d-flex">
                      {hasGap && <li className="page-item disabled"><span className="page-link">...</span></li>}
                      <li className={`page-item ${safePage === page ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(page)}>
                          {page}
                        </button>
                      </li>
                    </span>
                  );
                })}

              <li className={`page-item ${safePage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Siguiente"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};
