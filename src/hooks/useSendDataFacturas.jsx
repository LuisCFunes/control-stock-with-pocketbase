import { pb } from "../utilities/pocketbase_route";

export const useSendData = () => {
  async function putData(datos) {
    const {
      Numero,
      Cliente,
      Total,
      Tabla,
      ProductosV,
      Estado,
      discount_amount,
      exonerado_amount,
      exento_amount,
      condicion,
      formapago,
      detalle,
      observacion,
      subtotal15,
      isv15,
      subtotal18,
      isv18,
    } = datos;

    if (!ProductosV || ProductosV.length === 0) {
      alert("No hay datos para enviar");
      return;
    }

    try {
      const records = await pb.collection(Tabla).create({
        Numero,
        Cliente,
        Total,
        ProductosV,
        Estado,
        discount_amount,
        exonerado_amount,
        exento_amount,
        condicion,
        formapago,
        detalle,
        observacion,
        subtotal15,
        isv15,
        subtotal18,
        isv18,
      });
      console.log(records.created);
      console.log("Se envió correctamente");
    } catch (error) {
      console.error("Error de envío", error);
      console.log(datos);
      return;
    }
  }

  return { putData };
};
