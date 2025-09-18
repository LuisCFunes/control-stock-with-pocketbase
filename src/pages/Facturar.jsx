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
    <div className="container">
      <ListProducts list={cart} />
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Detalles de Facturación</h5>
              <CheckBoxText
                tipo={"Nombre del cliente"}
                onTextoChange={handleCliente}
              />
              {state.Cliente && (
                <p className="text-muted">Nombre del Cliente: {state.Cliente}</p>
              )}
              <CheckBoxNumber
                name={"RTN del cliente"}
                onCantidadChange={handleCantidad}
                tipo={"rtnCliente"}
              />
              {state.cantidades.rtnCliente > 0 && (
                <p className="text-muted">RTN: {state.cantidades.rtnCliente}</p>
              )}
              <CheckBoxNumber
                name={"Descuento"}
                onCantidadChange={handleCantidad}
                tipo={"cantidadDescuento"}
              />
              {state.cantidades.cantidadDescuento > 0 && (
                <p className="text-muted">Cantidad Descuento: {state.cantidades.cantidadDescuento}</p>
              )}
              <CheckBoxNumber
                name={"Exonerado"}
                onCantidadChange={handleCantidad}
                tipo={"cantidadExonerado"}
              />
              {state.cantidades.cantidadExonerado > 0 && (
                <p className="text-muted">Cantidad Exonerado: {state.cantidades.cantidadExonerado}</p>
              )}
              <CheckBoxNumber
                name={"Exento"}
                onCantidadChange={handleCantidad}
                tipo={"cantidadExento"}
              />
              {state.cantidades.cantidadExento > 0 && (
                <p className="text-muted">Cantidad Exento: {state.cantidades.cantidadExento}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-3">
        <h3>Total: {totalFactura}</h3>
        <Suelto />
        <button
          className="btn btn-primary btn-lg mt-3"
          onClick={handleClick}
        >
          Facturar
        </button>
      </div>
    </div>
  );
}
