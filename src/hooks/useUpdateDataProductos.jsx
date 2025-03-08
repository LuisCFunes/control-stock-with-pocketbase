import { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { pb, accessToken } from "../utilities/pocketbase_route";

export const useUpdateData = () => {
  const [errorMessage, setErrorMessage] = useState("");

  const updateData = async (infoProduct, limpiarInput) => {
    const datos = {
      Nombre: infoProduct.Nombre,
      Cantidad: infoProduct.Cantidad,
      Precio: infoProduct.Precio,
      id: infoProduct.id,
    };

    if (datos.Nombre === "" && datos.Cantidad === 0 && datos.Precio === 0) {
      setErrorMessage("Llena el formulario");
      return;
    }
    if (datos.Cantidad < 0 || datos.Precio < 0) {
      setErrorMessage("No ingrese Cantidad o Precio menor a cero");
      return;
    }

    try {
      pb.collection("Productos").requestOptions = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };
      const record = await pb.collection("Productos").update(datos.id, datos);
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
