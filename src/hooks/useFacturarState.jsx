import { useReducer } from "react";
import facturarReducer from "../utilities/FacturarReducer";

const useFacturarState = () => {
  const initialState = {
    cantidades: {
      cantidadDescuento: 0,
      cantidadExonerado: 0,
      cantidadExento: 0,
      rtnCliente: 0,
    },
    Cliente: "Cliente Ordinario",
  };

  const [state, dispatch] = useReducer(facturarReducer, initialState);

  const handleCliente = (nombreCliente) => {
    dispatch({ type: "SET_CLIENTE", payload: nombreCliente });
  };

  const handleCantidad = (identifier, value) => {
    dispatch({ type: "SET_CANTIDAD", payload: { identifier, value } });
  };

  return { state, handleCliente, handleCantidad };
};

export default useFacturarState;
