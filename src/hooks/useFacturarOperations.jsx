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
  const cantidadGravado18 = Number(state.cantidades.cantidadGravado18) || 0;
  const base18 = Math.min(Math.max(cantidadGravado18, 0), subTotal);
  const base15 = Base15(subTotal, base18);
  const isv15 = Impuesto15(base15);
  const isv18 = ISV18(base18);
  const totalFactura = Total(
    base15,
    isv15,
    base18,
    isv18,
    state.cantidades.cantidadExento,
    state.cantidades.cantidadExonerado,
    state.cantidades.cantidadDescuento,
  );
  const totalWords = NumberToWords(totalFactura);
  const { putData } = useSendData();
  const { updateQuantity } = useUpdate();

  const Facturar = (Numero) => {
    SendPdf({
      Numero,
      Fecha,
      Cliente: state.Cliente,
      condicion: state.condicion,
      formapago: state.formapago,
      detalle: state.detalle,
      observacion: state.observacion,
      totalFactura,
      cart,
      cantidades: state.cantidades,
      subTotal,
      base15,
      isv15,
      base18,
      isv18,
      totalWords,
    });
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

    try {
      const Numero = await getNextNumero();
      Facturar(Numero);
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
        subtotal15: base15,
        isv15,
        subtotal18: base18,
        isv18,
        discount_amount: state.cantidades.cantidadDescuento,
        exonerado_amount: state.cantidades.cantidadExonerado,
        exento_amount: state.cantidades.cantidadExento,
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
      exento: Number(state.cantidades.cantidadExento) || 0,
      exonerado: Number(state.cantidades.cantidadExonerado) || 0,
      descuento: Number(state.cantidades.cantidadDescuento) || 0,
    },
  };
};

export default useFacturarOperations;
