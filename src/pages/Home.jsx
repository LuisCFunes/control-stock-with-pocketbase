import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { ListProducts, ProductFilters, CategorySelect } from "../components";
import { useData } from "../hooks/useData";
import { useProductFilter } from "../hooks/useProductFilter";
import { useDeleteProduct } from "../hooks/useDeleteProduct";
import { pb } from "../utilities/pocketbase_route";

export default function Home() {
  const { deleteProduct } = useDeleteProduct();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      Nombre: "",
      Categoria: "General",
      Cantidad: "",
      Precio_Compra: "",
      Precio_Venta: "",
    },
  });

  const currentCategoria = watch("Categoria");

  const { listProducts, loading } = useData();

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

  const onSubmit = async (data) => {
    try {
      const chosenCategory = currentCategoria || data.Categoria || "General";
      const precioVenta = Number(data.Precio_Venta || 0);
      const precioCompra = Number(data.Precio_Compra || 0);
      const payload = {
        Nombre: data.Nombre,
        Cantidad: Number(data.Cantidad),
        Precio_Compra: precioCompra,
        Precio_Venta: precioVenta,
        Precio: precioVenta,
        Categoria: chosenCategory.trim(),
      };
      await pb.collection("Productos").create(payload);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("products_updated"));
      }
      withReactContent(Swal).fire({
        title: <p>Registro exitoso!</p>,
        html: `<i>El producto <b>${data.Nombre}</b> fue registrado con éxito en <b>${payload.Categoria}</b></i>`,
        icon: "success",
      });
      reset({
        Nombre: "",
        Categoria: "General",
        Cantidad: "",
        Precio_Compra: "",
        Precio_Venta: "",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "No se logró registrar el Producto!",
        footer: JSON.parse(JSON.stringify(error)).message,
      });
    }
  };

  const totalProducts = listProducts.length;
  const inventoryValue = listProducts.reduce(
    (sum, p) => sum + Number(p.Cantidad || 0) * Number(p.Precio_Venta ?? p.Precio ?? 0),
    0
  );
  const outOfStock = listProducts.filter((p) => Number(p.Cantidad || 0) === 0).length;
  const lowStock = listProducts.filter(
    (p) => Number(p.Cantidad || 0) > 0 && Number(p.Cantidad || 0) <= 5
  ).length;

  return (
    <>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon indigo">
              <i className="bi bi-box-seam"></i>
            </div>
            <div>
              <div className="stat-label">Productos</div>
              <div className="stat-value">{totalProducts}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon green">
              <i className="bi bi-coin"></i>
            </div>
            <div>
              <div className="stat-label">Valor inventario</div>
              <div className="stat-value">L. {inventoryValue.toLocaleString("es-HN", { maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon amber">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <div>
              <div className="stat-label">Stock bajo</div>
              <div className="stat-value">{lowStock}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div className="stat-icon red">
              <i className="bi bi-x-octagon"></i>
            </div>
            <div>
              <div className="stat-label">Agotados</div>
              <div className="stat-value">{outOfStock}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Formulario de registro */}
        <div className="col-lg-4">
          <div className="app-card">
            <div className="card-header">
              <h5>
                <i className="bi bi-plus-circle me-2 text-primary"></i>
                Registrar producto
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="Nombre" className="form-label">
                    Nombre del producto
                  </label>
                  <input
                    type="text"
                    id="Nombre"
                    {...register("Nombre", { required: true })}
                    className={`form-control ${errors.Nombre ? "is-invalid" : ""}`}
                    placeholder="Ej: Collar de perlas..."
                  />
                  {errors.Nombre && (
                    <div className="invalid-feedback">El nombre es requerido</div>
                  )}
                </div>

                <input type="hidden" {...register("Categoria")} />
                <CategorySelect
                  id="homeCategoria"
                  value={currentCategoria || "General"}
                  onChange={(val) =>
                    setValue("Categoria", val, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  products={listProducts}
                />

                <div className="mb-3">
                  <label htmlFor="Cantidad" className="form-label">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    id="Cantidad"
                    min="0"
                    {...register("Cantidad", { required: true, min: 0 })}
                    className={`form-control ${errors.Cantidad ? "is-invalid" : ""}`}
                    placeholder="Ej: 15..."
                  />
                  {errors.Cantidad && (
                    <div className="invalid-feedback">Cantidad requerida</div>
                  )}
                </div>

                <div className="row g-2 mb-4">
                  <div className="col-12 col-sm-6">
                    <label htmlFor="Precio_Compra" className="form-label">
                      Precio Compra (Lps.)
                    </label>
                    <input
                      type="number"
                      id="Precio_Compra"
                      min="0"
                      step="0.01"
                      {...register("Precio_Compra", { required: true, min: 0 })}
                      className={`form-control ${errors.Precio_Compra ? "is-invalid" : ""}`}
                      placeholder="Ej: 10.00"
                    />
                    {errors.Precio_Compra && (
                      <div className="invalid-feedback">Precio compra requerido</div>
                    )}
                  </div>
                  <div className="col-12 col-sm-6">
                    <label htmlFor="Precio_Venta" className="form-label">
                      Precio Venta (Lps.)
                    </label>
                    <input
                      type="number"
                      id="Precio_Venta"
                      min="0"
                      step="0.01"
                      {...register("Precio_Venta", { required: true, min: 0 })}
                      className={`form-control ${errors.Precio_Venta ? "is-invalid" : ""}`}
                      placeholder="Ej: 15.00"
                    />
                    {errors.Precio_Venta && (
                      <div className="invalid-feedback">Precio venta requerido</div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-app btn-primary-custom w-100">
                  <i className="bi bi-check-lg"></i>
                  Registrar
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Inventario con filtros y paginación de 10 */}
        <div className="col-lg-8">
          <div className="app-card">
            <div className="card-header">
              <h5>
                <i className="bi bi-list-ul me-2 text-primary"></i>
                Inventario actual
              </h5>
              <span className="text-muted small">
                {isInitialState
                  ? `${totalProducts} en total`
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
                showButtons={false}
                onDeleteProduct={deleteProduct}
                scopeName="Acción"
                loading={loading}
                isInitialState={isInitialState}
                onShowAll={() => setShowAll(true)}
                itemsPerPage={10}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
