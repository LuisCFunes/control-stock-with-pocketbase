import { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { pb } from "../utilities/pocketbase_route";

export const useUpdateData = () => {
  const [errorMessage, setErrorMessage] = useState("");

  const updateData = async (infoProduct, limpiarInput) => {
    const pVenta = Number(infoProduct.Precio_Venta ?? infoProduct.Precio ?? 0);
    const pCompra = Number(infoProduct.Precio_Compra ?? 0);
    const datos = {
      Nombre: infoProduct.Nombre,
      Cantidad: Number(infoProduct.Cantidad),
      Precio_Compra: pCompra,
      Precio_Venta: pVenta,
      Precio: pVenta,
      Categoria: infoProduct.Categoria ? infoProduct.Categoria.trim() : "General",
      id: infoProduct.id,
    };

    if (datos.Nombre === "" && datos.Cantidad === 0 && datos.Precio_Venta === 0) {
      setErrorMessage("Llena el formulario");
      return;
    }
    if (datos.Cantidad < 0 || datos.Precio_Venta < 0 || datos.Precio_Compra < 0) {
      setErrorMessage("No ingrese Cantidad o Precios menores a cero");
      return;
    }

    try {
      await pb.collection("Productos").update(datos.id, datos);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("products_updated"));
      }
      withReactContent(Swal).fire({
        title: <p>Actualización exitosa!</p>,
        html: `<i>El Nombre ${datos.Nombre} fue actualizado con éxito</i>`,
        icon: "success",
      });
      limpiarInput();
    } catch (error) {
      setErrorMessage("No se logró actualizar el Nombre");
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: errorMessage,
        footer: JSON.parse(JSON.stringify(error)).message,
      });
    }
  };

  return { updateData };
};
