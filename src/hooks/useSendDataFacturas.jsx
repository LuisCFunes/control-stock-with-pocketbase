import { invoiceService } from "../services";

export const useSendData = () => {
  async function putData(datos) {
    if (!datos.ProductosV || datos.ProductosV.length === 0) {
      alert("No hay datos para enviar");
      return;
    }

    try {
      const record = await invoiceService.createInvoice(datos);
      console.log("Se envió correctamente", record.id);
      return record;
    } catch (error) {
      console.error("Error al crear factura:", error);
      throw error;
    }
  }

  return { putData };
};
