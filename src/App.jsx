import { useState } from "react";
import AppLayout from "./components/AppLayout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartContext } from "./context/CartContext";
import Vender from "./pages/Vender";
import Home from "./pages/Home";
import Editar from "./pages/Editar";
import Reports from "./pages/Reports";

function App() {
  const [cart, setCart] = useState([]);

  const AddCart = (id, Nombre, Cantidad, Precio) => {
    const productoAgregado = { id, Nombre, Cantidad, Precio };
    const newCart = [...cart];
    const hasCart = newCart.find((prod) => prod.id === productoAgregado.id);

    if (hasCart) {
      hasCart.Cantidad += Cantidad;
    } else {
      newCart.push(productoAgregado);
    }
    setCart(newCart);
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, AddCart, setCart, clearCart }}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/Vender" element={<Vender />} />
            <Route path="/Editar" element={<Editar />} />
            <Route path="/Reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartContext.Provider>
  );
}

export default App;
