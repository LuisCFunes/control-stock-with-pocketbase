import { useReducer } from "react";
import facturarReducer from "../utilities/FacturarReducer";

const useFacturarState = () => {
  const initialState = {
    cantidades: {
      cantidadDescuento: 0,
      cantidadExonerado: 0,
      cantidadExento: 0,
      rtnCliente: 0,
      cantidadGravado18: 0,
    },
    Cliente: "Consumidor Final",
    condicion: "Contado",
    formapago: "Efectivo",
    detalle: "",
    observacion: "",
    diasCredito: 30,
  };

  const [state, dispatch] = useReducer(facturarReducer, initialState);

  const handleCliente = (nombreCliente) => {
    dispatch({ type: "SET_CLIENTE", payload: nombreCliente });
  };

  const handleCantidad = (identifier, value) => {
    dispatch({ type: "SET_CANTIDAD", payload: { identifier, value } });
  };

  const handleCondicion = (value) => {
    dispatch({ type: "SET_TEXT", payload: { identifier: "condicion", value } });
  };

  const handleFormapago = (value) => {
    dispatch({ type: "SET_TEXT", payload: { identifier: "formapago", value } });
  };

  const handleDetalle = (value) => {
    dispatch({ type: "SET_TEXT", payload: { identifier: "detalle", value } });
  };

  const handleObservacion = (value) => {
    dispatch({ type: "SET_TEXT", payload: { identifier: "observacion", value } });
  };

  const handleDiasCredito = (value) => {
    dispatch({ type: "SET_TEXT", payload: { identifier: "diasCredito", value } });
  };

  return {
    state,
    handleCliente,
    handleCantidad,
    handleCondicion,
    handleFormapago,
    handleDetalle,
    handleObservacion,
    handleDiasCredito,
  };
};

export default useFacturarState;
