import Facturar from "./Facturar";
import { useState, useEffect } from "react";
import { ProductCount, ListProducts, SearchBar } from "../components";
import { useData } from "../hooks/useData";

export default function Vender() {
  const { listProducts, loading } = useData();
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

  const handleSearch = (query) => {
    if (query.trim() === "") {
      setResults(listProducts);
    } else {
      const filteredResults = listProducts.filter((item) =>
        item.Nombre.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredResults);
    }
  };

  return (
    <main className="row mx-2">
      <section className="col-7">
        <ProductCount
          id={infoProduct.id}
          Nombre={infoProduct.Nombre}
          Precio={infoProduct.Precio}
        />
        <SearchBar onSearch={handleSearch} />
        <ListProducts
          list={results}
          showButtons={true}
          handleSendProductData={handleSendProductData}
          loading={loading}
        />
      </section>
      <section className="col-5">
        <Facturar />
      </section>
    </main>
  );
}
