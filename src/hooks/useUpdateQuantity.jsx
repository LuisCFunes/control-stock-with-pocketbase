import { pb, accessToken } from "../utilities/pocketbase_route";

export const useUpdate = () => {
  const updateQuantity = async (id, nuevaCantidad, tabla) => {
    try {
      pb.collection(tabla).requestOptions = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };

      const record = await pb.collection(tabla).getOne(id);

      const CantidadOriginal = record.Cantidad;
      const CantidadFinal = CantidadOriginal - nuevaCantidad;

      const data = {
        Cantidad: CantidadFinal,
      };

      const update = await pb.collection(tabla).update(id, data);
      console.log("Producto actualizado:", update);
    } catch (error) {
      console.error("Error inesperado:", error.message);
    }
  };

  return { updateQuantity };
};
