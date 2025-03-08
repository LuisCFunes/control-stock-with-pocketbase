import Facturar from "./Facturar";
import { useState, useEffect } from "react";
import { ProductCount, ListProducts } from "../components";
import { useData } from "../hooks/useData";

export default function Vender() {
  const { listProducts } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState(listProducts);
  const [infoProduct, setInfoProduct] = useState({
    id: "",
    Nombre: "",
    Cantidad: 0,
    Precio: 0,
  });

  useEffect(() => {
    setResults(listProducts);
  }, [listProducts]);

  const handleSendProductData = (data) => {
    setInfoProduct({
      id: data.id,
      Nombre: data.Nombre,
      Cantidad: data.Cantidad,
      Precio: data.Precio,
    });
  };

  const searchData = (query) => {
    return listProducts.filter((item) => {
      return item.Nombre.toLowerCase().includes(query.toLowerCase());
    });
  };

  const handleSearch = () => {
    const filteredResults = searchData(searchQuery);
    setResults(filteredResults);
  };

  return (
    <main className="row mx-2">
      <section className="col-7">
        <ProductCount
          id={infoProduct.id}
          Nombre={infoProduct.Nombre}
          Precio={infoProduct.Precio}
        />
        <div className="d-flex justify-content-center gap-5">
          <input
            type="text"
            className="w-50 h-75 my-auto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre del producto..."
          />
          <button
            className="btn btn-primary h-75 w-25 my-auto"
            onClick={handleSearch}
          >
            Buscar
          </button>
        </div>
        <ListProducts
          list={results}
          showButtons={true}
          handleSendProductData={handleSendProductData}
        />
      </section>
      <section className="col-5">
        <Facturar />
      </section>
    </main>
  );
}
