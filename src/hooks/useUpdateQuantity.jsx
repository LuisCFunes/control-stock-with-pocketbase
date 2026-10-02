import { productService } from "../services";

export const useUpdate = () => {
  const updateQuantity = async (id, nuevaCantidad) => {
    try {
      const update = await productService.decrementStock(id, nuevaCantidad);
      return update;
    } catch (error) {
      console.error("Error al actualizar inventario:", error.message);
      throw error;
    }
  };

  return { updateQuantity };
};
