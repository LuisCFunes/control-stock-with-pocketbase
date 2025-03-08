import "bootstrap/dist/css/bootstrap.min.css";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../App.css";
import { ListProducts } from "../components";
import { useData } from "../hooks/useData";
import { pb, accessToken } from "../utilities/pocketbase_route";

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const { listProducts } = useData();

  const onSubmit = async (data) => {
    try {
      pb.collection("Productos").requestOptions = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };
      const record = await pb.collection("Productos").create(data);
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

  return (
    <main className="container">
      <div className="card text-center">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="input-group mb-3">
              <label
                htmlFor="Nombre"
                className="input-group-text"
                id="basic-addon1"
              >
                Nombre del Nombre:
              </label>
              <input
                type="text"
                {...register("Nombre", { required: true })}
                className="form-control"
                placeholder="Collar de perlas..."
              />
              {errors.Nombre && (
                <span className="text-danger">Nombre requerido</span>
              )}
            </div>
            <div className="input-group mb-3">
              <label
                htmlFor="Cantidad"
                className="input-group-text"
                id="basic-addon1"
              >
                Cantidad:
              </label>
              <input
                type="number"
                {...register("Cantidad", { required: true })}
                className="form-control"
                placeholder="15..."
              />
              {errors.Cantidad && (
                <span className="text-danger">Cantidad requerida</span>
              )}
            </div>
            <div className="input-group mb-3">
              <label
                htmlFor="Precio"
                className="input-group-text"
                id="basic-addon1"
              >
                Precio:
              </label>
              <input
                type="number"
                {...register("Precio", { required: true })}
                className="form-control"
                placeholder="15..."
              />
              {errors.Precio && (
                <span className="text-danger">Precio requerido</span>
              )}
            </div>
            <div className="card-footer text-body-secondary">
              <div>
                <button type="submit" className="btn btn-success m-2">
                  Registrar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <ListProducts list={listProducts} showButtons={false} />
    </main>
  );
}
