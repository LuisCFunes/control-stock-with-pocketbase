import { useSendData, useUpdate } from "../hooks";
import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import {
  FechaEmitida,
  SubTotal,
  Impuesto15,
  Total,
  NumeroFactura,
} from "../utilities/FacturaResultados";
import SendPdf from "../utilities/SendPdf";
import NumberToWords from "../utilities/Number-to-Words";

const useFacturarOperations = (state) => {
  const { cart, clearCart } = useContext(CartContext);
  const Numero = NumeroFactura();
  const Fecha = FechaEmitida();
  const subTotal = SubTotal();
  const impuesto15 = Impuesto15(subTotal);
  const totalFactura = Total(
    subTotal,
    impuesto15,
    state.cantidades.cantidadDescuento,
  );
  const totalWords = NumberToWords(totalFactura);
  const { putData } = useSendData(
    Numero,
    state.Cliente,
    totalFactura,
    "Facturas",
    cart,
    true,
    state.cantidades.cantidadDescuento,
    state.cantidades.cantidadExonerado,
    state.cantidades.cantidadExento,
  );
  const { updateQuantity } = useUpdate();

  const Facturar = () => {
    if (cart.length > 0) {
      SendPdf({
        Numero,
        Fecha,
        Cliente: state.Cliente,
        totalFactura,
        cart,
        cantidades: state.cantidades,
        subTotal,
        impuesto15,
        totalWords,
      });
    } else {
      alert("No hay productos para facturar");
    }
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

    if (success) {
      alert("Venta realizada");
      window.location.reload();
    } else {
      alert(
        "Hubo un error al procesar algunos productos. Por favor, revisa la consola para más detalles.",
      );
    }
  };
  const handleClick = async () => {
    try {
      Facturar();
      await putData();
      await updateCantidad();
      clearCart();
    } catch (error) {
      alert("Error:", error);
      return;
    }
  };

  return { handleClick, totalFactura };
};

export default useFacturarOperations;
