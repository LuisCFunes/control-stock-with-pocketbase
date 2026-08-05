/* eslint-disable react/prop-types */
import { useState } from "react";

export const SearchBar = ({ onSearch, placeholder = "Buscar productos..." }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="position-relative mb-3">
      <i
        className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"
        style={{ zIndex: 5 }}
      ></i>
      <input
        type="text"
        className="form-control ps-5"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
      />
      {query && (
        <button
          type="button"
          className="btn position-absolute top-50 translate-middle-y end-0 me-1 text-muted border-0"
          onClick={() => {
            setQuery("");
            onSearch("");
          }}
          aria-label="Limpiar búsqueda"
        >
          <i className="bi bi-x-circle"></i>
        </button>
      )}
    </div>
  );
};
