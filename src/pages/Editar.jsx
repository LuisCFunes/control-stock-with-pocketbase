import { useState } from "react";
import { useData, useUpdateData, useProductFilter, useDeleteProduct } from "../hooks/index";
import { ListProducts, ProductFilters, CategorySelect } from "../components";

export default function Editar() {
  const { listProducts, loading } = useData();
  const { updateData } = useUpdateData();
  const { deleteProduct } = useDeleteProduct();
  const [infoProduct, setInfoProduct] = useState({
    id: "",
    Nombre: "",
    Cantidad: 0,
    Precio_Compra: 0,
    Precio_Venta: 0,
    Categoria: "General",
  });

  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    showAll,
    setShowAll,
    toggleShowAll,
    categories,
    hasActiveFilters,
    filteredProducts,
    isInitialState,
    clearFilters,
  } = useProductFilter(listProducts, { defaultShowAll: false });

  const hasSelection = Boolean(infoProduct.id);

  const limpiarInput = () => {
    setInfoProduct({
      id: "",
      Nombre: "",
      Cantidad: 0,
      Precio_Compra: 0,
      Precio_Venta: 0,
      Categoria: "General",
    });
  };

  const handleSendProductData = (data) => {
    const pVenta =
      data.Precio_Venta !== undefined && data.Precio_Venta !== null
        ? Number(data.Precio_Venta)
        : Number(data.Precio || 0);
    const pCompra =
      data.Precio_Compra !== undefined && data.Precio_Compra !== null
        ? Number(data.Precio_Compra)
        : 0;

    setInfoProduct({
      id: data.id,
      Nombre: data.Nombre,
      Cantidad: Number(data.Cantidad),
      Precio_Compra: pCompra,
      Precio_Venta: pVenta,
      Categoria: data.Categoria || "General",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateData(infoProduct, limpiarInput);
  };

  return (
    <div className="row g-4">
      {/* Formulario de Edición */}
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
                    required
                  />
                </div>

                <CategorySelect
                  id="editCategoria"
                  value={infoProduct.Categoria}
                  onChange={(val) =>
                    setInfoProduct({ ...infoProduct, Categoria: val })
                  }
                  products={listProducts}
                />

                <div className="mb-3">
                  <label htmlFor="editCantidad" className="form-label">
                    Cantidad (Stock)
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
                    required
                  />
                </div>

                <div className="row g-2 mb-4">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="editPrecioCompra" className="form-label">
                      Precio Compra (Lps.)
                    </label>
                    <input
                      type="number"
                      id="editPrecioCompra"
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={infoProduct.Precio_Compra}
                      onChange={(e) =>
                        setInfoProduct({
                          ...infoProduct,
                          Precio_Compra: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label htmlFor="editPrecioVenta" className="form-label">
                      Precio Venta (Lps.)
                    </label>
                    <input
                      type="number"
                      id="editPrecioVenta"
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={infoProduct.Precio_Venta}
                      onChange={(e) =>
                        setInfoProduct({
                          ...infoProduct,
                          Precio_Venta: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-app btn-primary-custom flex-fill">
                    <i className="bi bi-check-lg me-1"></i>
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => deleteProduct(infoProduct, limpiarInput)}
                    title="Eliminar este producto"
                  >
                    <i className="bi bi-trash3 me-1"></i>
                    Eliminar
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={limpiarInput}
                    title="Cancelar edición"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Productos con Filtros y Paginación de 10 */}
      <div className="col-lg-8">
        <div className="app-card">
          <div className="card-header">
            <h5>
              <i className="bi bi-list-ul me-2 text-primary"></i>
              Inventario
            </h5>
            <span className="text-muted small">
              {isInitialState
                ? `${listProducts.length} productos en total`
                : `${filteredProducts.length} encontrados`}
            </span>
          </div>
          <div className="card-body">
            <ProductFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              stockFilter={stockFilter}
              onStockFilterChange={setStockFilter}
              categories={categories}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              totalResults={filteredProducts.length}
              showAll={showAll}
              onToggleShowAll={toggleShowAll}
            />

            <ListProducts
              list={filteredProducts}
              showButtons={true}
              handleSendProductData={handleSendProductData}
              onDeleteProduct={(prod) => {
                deleteProduct(prod, () => {
                  if (infoProduct.id === prod.id) {
                    limpiarInput();
                  }
                });
              }}
              scopeName="Acciones"
              btnName="Editar"
              loading={loading}
              isInitialState={isInitialState}
              onShowAll={() => setShowAll(true)}
              itemsPerPage={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
