import { pb } from "../utilities/pocketbase_route";

export const useSendData = () => {
  async function putData(datos) {
    const {
      Numero,
      Cliente,
      Total,
      Tabla = "Facturas",
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
      estado_pago,
      saldo_pendiente,
      dias_credito,
      fecha_vencimiento,
      abonos,
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
        estado_pago: estado_pago || (condicion === "Credito" ? "Pendiente" : "Pagada"),
        saldo_pendiente:
          saldo_pendiente !== undefined
            ? saldo_pendiente
            : condicion === "Credito"
              ? Total
              : 0,
        dias_credito: dias_credito || 0,
        fecha_vencimiento: fecha_vencimiento || "",
        abonos: abonos || [],
      });
      console.log(records.created);
      console.log("Se envió correctamente");
      return records;
    } catch (error) {
      console.error("Error de envío", error);
      console.log(datos);
      throw error;
    }
  }

  return { putData };
};
