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

  const AddCart = (id, Nombre, Cantidad, Precio, impuesto = "15") => {
    const tipo = typeof impuesto === "boolean" ? (impuesto ? "exento" : "15") : (impuesto || "15");
    const productoAgregado = {
      id,
      Nombre,
      Cantidad,
      Precio,
      tipoImpuesto: tipo,
      exento: tipo === "exento",
      exonerado: tipo === "exonerado",
    };
    const newCart = [...cart];
    const hasCart = newCart.find((prod) => prod.id === productoAgregado.id);

    if (hasCart) {
      hasCart.Cantidad += Cantidad;
      hasCart.tipoImpuesto = tipo;
      hasCart.exento = tipo === "exento";
      hasCart.exonerado = tipo === "exonerado";
    } else {
      newCart.push(productoAgregado);
    }
    setCart(newCart);
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

  const toggleExento = (id) => {
    setCart((prevCart) =>
      prevCart.map((prod) => {
        if (prod.id !== id) return prod;
        const nuevoTipo = prod.tipoImpuesto === "exento" ? "15" : "exento";
        return {
          ...prod,
          tipoImpuesto: nuevoTipo,
          exento: nuevoTipo === "exento",
        };
      })
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
        toggleExento,
        setProductTax,
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
