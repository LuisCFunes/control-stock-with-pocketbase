import { useSendData, useUpdate } from "../hooks";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { pb } from "../utilities/pocketbase_route";
import { FechaEmitida, SubTotal, Impuesto15, ISV18, Base15, Total } from "../utilities/FacturaResultados";
import SendPdf from "../utilities/SendPdf";
import NumberToWords from "../utilities/Number-to-Words";

const getNextNumero = async () => {
  const records = await pb.collection("Facturas").getList(1, 1, {
    sort: "-Numero",
  });
  const lastNumero = records.items[0]?.Numero || 0;
  return lastNumero + 1;
};

const useFacturarOperations = (state) => {
  const { cart, clearCart } = useContext(CartContext);
  const Fecha = FechaEmitida();
  const subTotal = SubTotal();

  // Desglosar carrito por tipo de impuesto (15%, 18%, Exento, Exonerado)
  const cartExento = cart
    .filter((prod) => prod.tipoImpuesto === "exento" || prod.exento === true)
    .reduce((acc, prod) => acc + Number(prod.Cantidad || 0) * Number(prod.Precio || 0), 0);

  const cartExonerado = cart
    .filter((prod) => prod.tipoImpuesto === "exonerado" || prod.exonerado === true)
    .reduce((acc, prod) => acc + Number(prod.Cantidad || 0) * Number(prod.Precio || 0), 0);

  const cart18 = cart
    .filter((prod) => prod.tipoImpuesto === "18")
    .reduce((acc, prod) => acc + Number(prod.Cantidad || 0) * Number(prod.Precio || 0), 0);

  const cart15 = cart
    .filter(
      (prod) =>
        (!prod.tipoImpuesto && !prod.exento && !prod.exonerado) ||
        prod.tipoImpuesto === "15"
    )
    .reduce((acc, prod) => acc + Number(prod.Cantidad || 0) * Number(prod.Precio || 0), 0);

  // Totales exento y exonerado (ambos 0% ISV)
  const totalExento = Math.round(cartExento * 100) / 100;
  const totalExonerado = Math.round(cartExonerado * 100) / 100;

  // Base gravada al 18% y su ISV (18%)
  const base18 = Math.round(cart18 * 100) / 100;
  const isv18 = ISV18(base18);

  // Base gravada al 15% y su ISV (15%)
  const base15 = Math.round(cart15 * 100) / 100;
  const isv15 = Impuesto15(base15);

  const descuentoNum = Number(state.cantidades?.cantidadDescuento) || 0;

  const totalFactura = Total(
    base15,
    isv15,
    base18,
    isv18,
    totalExento,
    totalExonerado,
    descuentoNum,
  );
  const totalWords = NumberToWords(totalFactura);
  const { putData } = useSendData();
  const { updateQuantity } = useUpdate();

  const diasCreditoNum = Number(state.diasCredito) || 30;
  const hoy = new Date();
  const fechaVenc = new Date(hoy);
  fechaVenc.setDate(fechaVenc.getDate() + diasCreditoNum);
  const fechaVencimientoStr = state.condicion === "Credito" ? fechaVenc.toISOString().split("T")[0] : "";

  const Facturar = (Numero, targetWindow = null) => {
    SendPdf(
      {
        Numero,
        Fecha,
        Cliente: state.Cliente,
        condicion: state.condicion,
        formapago: state.formapago,
        detalle: state.detalle,
        observacion: state.observacion,
        dias_credito: state.condicion === "Credito" ? diasCreditoNum : 0,
        fecha_vencimiento: fechaVencimientoStr,
        totalFactura,
        cart,
        cantidades: {
          ...state.cantidades,
          cantidadExento: totalExento,
          cantidadExonerado: totalExonerado,
        },
        subTotal,
        base15,
        isv15,
        base18,
        isv18,
        totalWords,
      },
      {
        autoOpen: true,
        autoDownload: true,
        targetWindow,
      }
    );
  };

  const updateCantidad = async () => {
    let success = true;

    for (const item of cart) {
      const { id, Cantidad, Precio } = item;
      if (Cantidad <= 0 || Precio <= 0) {
        console.log(
          `La cantidad o el precio para el producto con ID ${id} es menor o igual a cero.`,
        );
        continue;
      }
      try {
        await updateQuantity(id, Cantidad, "Productos");
        console.log(`Updated item with ID ${id} successfully.`);
      } catch (error) {
        console.error(`Failed to update item with ID ${id}:`, error);
        success = false;
      }
    }

    return success;
  };

  const handleClick = async () => {
    if (cart.length === 0) {
      alert("No hay productos para facturar");
      return;
    }

    // Pre-abrir la ventana sincrónicamente al clic para evitar bloqueos del navegador
    let pdfWindow = null;
    try {
      pdfWindow = window.open("", "_blank");
    } catch (e) {
      console.warn("No se pudo pre-abrir ventana del PDF:", e);
    }

    try {
      const Numero = await getNextNumero();
      Facturar(Numero, pdfWindow);
      await putData({
        Numero,
        Cliente: state.Cliente,
        Total: totalFactura,
        Tabla: "Facturas",
        ProductosV: cart,
        Estado: true,
        condicion: state.condicion,
        formapago: state.formapago,
        detalle: state.detalle,
        observacion: state.observacion,
        dias_credito: state.condicion === "Credito" ? diasCreditoNum : 0,
        fecha_vencimiento: fechaVencimientoStr,
        estado_pago: state.condicion === "Credito" ? "Pendiente" : "Pagada",
        saldo_pendiente: state.condicion === "Credito" ? totalFactura : 0,
        abonos: [],
        subtotal15: base15,
        isv15,
        subtotal18: base18,
        isv18,
        discount_amount: descuentoNum,
        exonerado_amount: totalExonerado,
        exento_amount: totalExento,
      });
      const success = await updateCantidad();
      clearCart();

      if (success) {
        alert("Venta realizada");
        window.location.reload();
      } else {
        alert(
          "Hubo un error al procesar algunos productos. Por favor, revisa la consola para más detalles.",
        );
      }
    } catch (error) {
      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.close();
      }
      alert("Error:", error);
      return;
    }
  };

  return {
    handleClick,
    totalFactura,
    totalWords,
    breakdown: {
      subTotal,
      base15,
      isv15,
      base18,
      isv18,
      exento: totalExento,
      exonerado: totalExonerado,
      descuento: descuentoNum,
    },
  };
};

export default useFacturarOperations;
