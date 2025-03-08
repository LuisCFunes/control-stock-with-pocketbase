import { useContext } from "react";
import { ListProducts, CheckBoxNumber, CheckBoxText } from "../components";
import { CartContext } from "../context/CartContext";
import useFacturarState from "../hooks/useFacturarState";
import useFacturarOperations from "../hooks/useFacturarOperations";
import Suelto from "../components/Suelto";

export default function Facturar() {
  const { cart } = useContext(CartContext);
  const { state, handleCliente, handleCantidad } = useFacturarState();

  const { handleClick, totalFactura } = useFacturarOperations(state);

  return (
    <>
      <ListProducts list={cart} />
      <div className="d-flex flex-column align-items-center">
        <CheckBoxText
          tipo={"Nombre del cliente"}
          onTextoChange={handleCliente}
        />
        <p>Nombre del Cliente: {state.Cliente}</p>
        <CheckBoxNumber
          name={"RTN del cliente"}
          onCantidadChange={handleCantidad}
          tipo={"rtnCliente"}
        />
        <p>RTN: {state.cantidades.rtnCliente}</p>
        <CheckBoxNumber
          name={"Descuento"}
          onCantidadChange={handleCantidad}
          tipo={"cantidadDescuento"}
        />
        <p>Cantidad Descuento: {state.cantidades.cantidadDescuento}</p>

        <CheckBoxNumber
          name={"Exonerado"}
          onCantidadChange={handleCantidad}
          tipo={"cantidadExonerado"}
        />
        <p>Cantidad Exonerado: {state.cantidades.cantidadExonerado}</p>

        <CheckBoxNumber
          name={"Exento"}
          onCantidadChange={handleCantidad}
          tipo={"cantidadExento"}
        />
        <p>Cantidad Exento: {state.cantidades.cantidadExento}</p>
      </div>
      <div className="text-center">
        <h3>Total:{totalFactura}</h3>
        <Suelto />
      </div>
      <button
        className="d-flex justify-content-center btn btn-primary mx-auto rounded-0"
        onClick={handleClick}
      >
        Facturar
      </button>
    </>
  );
}
