import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { ListProducts } from "../components";
import { useData } from "../hooks/useData";
import { pb } from "../utilities/pocketbase_route";

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const { listProducts, loading } = useData();

  const onSubmit = async (data) => {
    try {
      await pb.collection("Productos").create(data);
      withReactContent(Swal).fire({
        title: <p>Registro exitoso!</p>,
        html: `<i>El Nombre <b>${data.Nombre}</b> fue registrado con éxito</i>`,
        icon: "success",
      });
      reset();
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
    (sum, p) => sum + Number(p.Cantidad || 0) * Number(p.Precio || 0),
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
                <div className="mb-4">
                  <label htmlFor="Precio" className="form-label">
                    Precio (Lps.)
                  </label>
                  <input
                    type="number"
                    id="Precio"
                    min="0"
                    step="0.01"
                    {...register("Precio", { required: true, min: 0 })}
                    className={`form-control ${errors.Precio ? "is-invalid" : ""}`}
                    placeholder="Ej: 15.00..."
                  />
                  {errors.Precio && (
                    <div className="invalid-feedback">Precio requerido</div>
                  )}
                </div>
                <button type="submit" className="btn btn-app btn-primary-custom w-100">
                  <i className="bi bi-check-lg"></i>
                  Registrar
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="app-card">
            <div className="card-header">
              <h5>
                <i className="bi bi-list-ul me-2 text-primary"></i>
                Inventario actual
              </h5>
              <span className="text-muted small">{totalProducts} productos</span>
            </div>
            <div className="card-body p-0">
              <ListProducts list={listProducts} showButtons={false} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
