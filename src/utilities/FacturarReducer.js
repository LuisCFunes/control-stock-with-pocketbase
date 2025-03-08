const facturarReducer = (state, action) => {
    switch (action.type) {
      case 'SET_CANTIDAD':
        return {
          ...state,
          cantidades: {
            ...state.cantidades,
            [action.payload.identifier]: action.payload.value,
          },
        };
      case 'SET_CLIENTE':
        return {
          ...state,
          Cliente: action.payload,
        };
      case 'CLEAR_CART':
        return {
          ...state,
          cart: [],
        };
      default:
        return state;
    }
  };
  
  export default facturarReducer;