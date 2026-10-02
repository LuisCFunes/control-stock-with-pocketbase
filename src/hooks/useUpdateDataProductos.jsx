import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { productService } from "../services";

export const useUpdateData = () => {
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
      Swal.fire({
        icon: "warning",
        title: "Formulario incompleto",
        text: "Llena el formulario",
      });
      return;
    }
    if (datos.Cantidad < 0 || datos.Precio_Venta < 0 || datos.Precio_Compra < 0) {
      Swal.fire({
        icon: "warning",
        title: "Valores inválidos",
        text: "No ingrese Cantidad o Precios menores a cero",
      });
      return;
    }

    try {
      await productService.updateProduct(datos.id, datos);
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
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "No se logró actualizar el producto",
        footer: error?.message || String(error),
      });
    }
  };

  return { updateData };
};
