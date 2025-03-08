import { useState } from "react";
import Navigation from "./components/Navbar";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartContext } from "./context/CartContext";
import Vender from "./pages/Vender";
import Home from "./pages/Home";
import Facturar from "./pages/Facturar";
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
    <>
      <CartContext.Provider value={{ cart, AddCart, setCart, clearCart }}>
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Vender" element={<Vender />} />
            <Route path="/Facturar" element={<Facturar />} />
            <Route path="/Editar" element={<Editar />} />
            <Route path="/Reports" element={<Reports />} />
          </Routes>
        </BrowserRouter>
      </CartContext.Provider>
    </>
  );
}

export default App;
