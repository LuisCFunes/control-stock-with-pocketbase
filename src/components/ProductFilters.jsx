/* eslint-disable react/prop-types */
export const ProductFilters = ({
  searchQuery = "",
  onSearchChange,
  selectedCategory = "",
  onCategoryChange,
  stockFilter = "all",
  onStockFilterChange,
  categories = [],
  onClearFilters,
  hasActiveFilters = false,
  totalResults = 0,
  showAll = false,
  onToggleShowAll,
}) => {
  return (
    <div className="product-filters mb-3">
      <div className="row g-2 align-items-center">
        {/* Buscador */}
        <div className="col-12 col-md-5">
          <div className="position-relative">
            <i
              className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"
              style={{ zIndex: 5 }}
            ></i>
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn position-absolute top-50 translate-middle-y end-0 me-1 text-muted border-0"
                onClick={() => onSearchChange("")}
                aria-label="Limpiar búsqueda"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            )}
          </div>
        </div>

        {/* Filtro por Categoría */}
        <div className="col-6 col-md-4">
          <div className="input-group">
            <span className="input-group-text bg-white text-muted">
              <i className="bi bi-tags"></i>
            </span>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtro por Stock */}
        <div className="col-6 col-md-3">
          <div className="input-group">
            <span className="input-group-text bg-white text-muted">
              <i className="bi bi-funnel"></i>
            </span>
            <select
              className="form-select"
              value={stockFilter}
              onChange={(e) => onStockFilterChange(e.target.value)}
            >
              <option value="all">Todo el stock</option>
              <option value="in_stock">En stock (&gt; 0)</option>
              <option value="low_stock">Stock bajo (1-5)</option>
              <option value="out_of_stock">Agotados (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Barra de estado / pills y acciones rápidas */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2 pt-1">
        {/* Pills rápidas de categorías */}
        <div className="d-flex flex-wrap align-items-center gap-1">
          <button
            type="button"
            className={`btn btn-sm ${
              selectedCategory === "" ? "btn-primary" : "btn-light border"
            } rounded-pill py-0 px-2 small`}
            style={{ fontSize: "11px", height: "24px" }}
            onClick={() => onCategoryChange("")}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm ${
                selectedCategory === cat ? "btn-primary" : "btn-light border"
              } rounded-pill py-0 px-2 small`}
              style={{ fontSize: "11px", height: "24px" }}
              onClick={() => onCategoryChange(cat === selectedCategory ? "" : cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Info y botón de limpiar o mostrar todos */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {hasActiveFilters ? (
            <>
              <span className="badge bg-light text-dark border">
                <i className="bi bi-check-circle me-1 text-primary"></i>
                {totalResults} {totalResults === 1 ? "resultado" : "resultados"}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-link text-danger text-decoration-none p-0 small"
                onClick={onClearFilters}
              >
                <i className="bi bi-trash3 me-1"></i>
                Limpiar
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`btn btn-sm ${showAll ? "btn-outline-secondary" : "btn-outline-primary"} py-0 px-2`}
              style={{ fontSize: "12px", height: "24px" }}
              onClick={onToggleShowAll}
            >
              <i className={`bi ${showAll ? "bi-eye-slash" : "bi-eye"} me-1`}></i>
              {showAll ? "Ocultar lista completa" : "Ver todos"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
