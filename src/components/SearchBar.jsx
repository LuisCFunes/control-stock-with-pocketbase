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
    <div className="input-group mb-3">
      <span className="input-group-text">
        <i className="bi bi-search"></i>
      </span>
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
      />
    </div>
  );
};