import { useState } from "react";
import AppLayout from "./components/AppLayout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartContext } from "./context/CartContext";
import Vender from "./pages/Vender";
import Home from "./pages/Home";
import Editar from "./pages/Editar";
import Reports from "./pages/Reports";
import Clientes from "./pages/Clientes";
import Creditos from "./pages/Creditos";

function App() {
  const [cart, setCart] = useState([]);

  const AddCart = (id, Nombre, Cantidad, Precio, impuesto = "15", descripcion = "") => {
    const tipo = typeof impuesto === "boolean" ? (impuesto ? "exento" : "15") : (impuesto || "15");
    const numPrecio = Number(Precio) || 0;
    const numCantidad = Number(Cantidad) || 1;
    const productoAgregado = {
      id,
      Nombre,
      Cantidad: numCantidad,
      Precio: numPrecio,
      tipoImpuesto: tipo,
      exento: tipo === "exento",
      exonerado: tipo === "exonerado",
      descripcion: descripcion || "",
    };
    const newCart = [...cart];
    const hasCart = newCart.find((prod) => prod.id === productoAgregado.id);

    if (hasCart) {
      hasCart.Cantidad += numCantidad;
      hasCart.Precio = numPrecio;
      hasCart.tipoImpuesto = tipo;
      hasCart.exento = tipo === "exento";
      hasCart.exonerado = tipo === "exonerado";
      if (descripcion) hasCart.descripcion = descripcion;
    } else {
      newCart.push(productoAgregado);
    }
    setCart(newCart);
  };

  const updateProductPrice = (id, newPrice) => {
    const priceNum = Math.max(0, Number(newPrice) || 0);
    setCart((prevCart) =>
      prevCart.map((prod) =>
        prod.id === id ? { ...prod, Precio: priceNum } : prod
      )
    );
  };

  const updateProductQuantity = (id, newQuantity) => {
    const cantNum = Math.max(1, Number(newQuantity) || 1);
    setCart((prevCart) =>
      prevCart.map((prod) =>
        prod.id === id ? { ...prod, Cantidad: cantNum } : prod
      )
    );
  };

  const updateProductDescription = (id, newDescription) => {
    setCart((prevCart) =>
      prevCart.map((prod) =>
        prod.id === id ? { ...prod, descripcion: newDescription } : prod
      )
    );
  };

  const setProductTax = (id, tipoImpuesto) => {
    setCart((prevCart) =>
      prevCart.map((prod) =>
        prod.id === id
          ? {
              ...prod,
              tipoImpuesto,
              exento: tipoImpuesto === "exento",
              exonerado: tipoImpuesto === "exonerado",
            }
          : prod
      )
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((prod) => prod.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        AddCart,
        setCart,
        clearCart,
        setProductTax,
        updateProductPrice,
        updateProductQuantity,
        updateProductDescription,
        removeFromCart,
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/Vender" element={<Vender />} />
            <Route path="/Editar" element={<Editar />} />
            <Route path="/Clientes" element={<Clientes />} />
            <Route path="/Creditos" element={<Creditos />} />
            <Route path="/Reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartContext.Provider>
  );
}

export default App;
