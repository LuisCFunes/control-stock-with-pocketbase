import Facturar from "./Facturar";
import { useState } from "react";
import {
  ProductCount,
  ListProducts,
  ProductFilters,
  ClientSelect,
} from "../components";
import { useData } from "../hooks/useData";
import { useProductFilter } from "../hooks/useProductFilter";
import useFacturarState from "../hooks/useFacturarState";

export default function Vender() {
  const { listProducts, loading } = useData();
  const [infoProduct, setInfoProduct] = useState({
    id: "",
    Nombre: "",
    Cantidad: 0,
    Precio: 0,
  });

  const facturarState = useFacturarState();
  const { state, handleCliente, handleCantidad } = facturarState;

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

  const handleSendProductData = (data) => {
    const pVenta =
      data.Precio_Venta !== undefined && data.Precio_Venta !== null
        ? Number(data.Precio_Venta)
        : Number(data.Precio || 0);

    setInfoProduct({
      id: data.id,
      Nombre: data.Nombre,
      Cantidad: data.Cantidad,
      Precio: pVenta,
    });
  };

  return (
    <div className="row g-4">
      <div className="col-lg-6">
        {/* Datos del cliente arriba de selección de productos */}
        <div className="app-card mb-4">
          <div className="card-header">
            <h5>
              <i className="bi bi-person me-2 text-primary"></i>
              Datos del cliente
            </h5>
          </div>
          <div className="card-body">
            <ClientSelect
              cliente={state.Cliente}
              rtn={state.cantidades.rtnCliente}
              onClienteChange={handleCliente}
              onRtnChange={handleCantidad}
            />
          </div>
        </div>

        {/* Selección de productos */}
        <div className="app-card">
          <div className="card-header">
            <h5>
              <i className="bi bi-box-seam me-2 text-primary"></i>
              Selección de productos
            </h5>
            <span className="text-muted small">
              <i className="bi bi-bag me-1"></i>
              {isInitialState
                ? `${listProducts.length} en catálogo`
                : `${filteredProducts.length} encontrados`}
            </span>
          </div>
          <div className="card-body">
            <ProductCount
              id={infoProduct.id}
              Nombre={infoProduct.Nombre}
              Precio={infoProduct.Precio}
            />

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
              loading={loading}
              isInitialState={isInitialState}
              onShowAll={() => setShowAll(true)}
              itemsPerPage={10}
            />
          </div>
        </div>
      </div>
      <div className="col-lg-6">
        <Facturar facturarState={facturarState} />
      </div>
    </div>
  );
}
