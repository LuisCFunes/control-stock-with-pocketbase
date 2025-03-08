import { CartContext } from "../../context/CartContext";
import { useContext } from "react";

export default function SubTotal() {
  const { cart } = useContext(CartContext);
  const subtotal = cart.reduce(
    (acc, prod) => acc + prod.Cantidad * prod.Precio,
    0
  );
  const subtotalConDosDecimales = Math.round(subtotal * 100) / 100;
  return subtotalConDosDecimales;
}
