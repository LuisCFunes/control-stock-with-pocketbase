import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { pb } from "../utilities/pocketbase_route";

export const useDeleteProduct = () => {
  const deleteProduct = async (product, onDeleted) => {
    if (!product || !product.id) return;

    const result = await Swal.fire({
      title: `¿Eliminar "${product.Nombre}"?`,
      html: `¿Estás seguro de que deseas eliminar este producto del inventario?<br/><br/><span class="text-danger small"><i class="bi bi-exclamation-triangle me-1"></i>Esta acción no se puede deshacer.</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar producto",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Eliminando producto...",
        text: "Por favor espera...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        await pb.collection("Productos").delete(product.id);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("products_updated"));
        }

        if (onDeleted) {
          onDeleted(product);
        }

        withReactContent(Swal).fire({
          title: "¡Eliminado!",
          text: `El producto "${product.Nombre}" fue eliminado con éxito.`,
          icon: "success",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        Swal.fire({
          icon: "error",
          title: "Error al eliminar",
          text: "No se logró eliminar el producto en la base de datos.",
          footer: error?.message || "",
        });
      }
    }
  };

  return { deleteProduct };
};
