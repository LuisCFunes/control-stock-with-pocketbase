/* eslint-disable react/prop-types */
import { useState } from "react";

export function CheckBoxText({ tipo, onTextoChange }) {
  const [isChecked, setisChecked] = useState(false);
  const [texto, setTexto] = useState("Cliente Ordinario");

  const handleCheck = () => {
    setisChecked(!isChecked);
    if (!isChecked || !texto) {
      setTexto("");
      onTextoChange("");
    }
  };

  const handleTextChange = (e) => {
    if(isChecked){
      setTexto(e.target.value);
      onTextoChange(e.target.value);
    }
  };

  const inputId = `checkbox-${tipo.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="mb-3">
      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id={inputId}
          checked={isChecked}
          onChange={handleCheck}
        />
        <label className="form-check-label" htmlFor={inputId}>
          <strong>{tipo}</strong>
        </label>
      </div>

      {isChecked && (
        <div className="mt-2">
          <label htmlFor={`${inputId}-input`} className="form-label">
            Ingrese el {tipo}:
          </label>
          <input
            type="text"
            className="form-control"
            id={`${inputId}-input`}
            placeholder={`Ej: Juan Pérez`}
            value={texto}
            onChange={handleTextChange}
          />
        </div>
      )}
    </div>
  );
}
