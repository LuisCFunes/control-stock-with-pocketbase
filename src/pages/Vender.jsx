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
    <div className="row g-4">
      <div className="col-lg-6">
        <div className="app-card">
          <div className="card-header">
            <h5>
              <i className="bi bi-box-seam me-2 text-primary"></i>
              Selección de productos
            </h5>
            <span className="text-muted small">
              <i className="bi bi-bag me-1"></i>
              {results.length} disponibles
            </span>
          </div>
          <div className="card-body">
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
          </div>
        </div>
      </div>
      <div className="col-lg-6">
        <Facturar />
      </div>
    </div>
  );
}
