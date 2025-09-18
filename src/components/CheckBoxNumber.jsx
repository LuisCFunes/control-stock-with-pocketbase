/* eslint-disable react/prop-types */
import { useState } from "react";
import redondearDecimales from "../utilities/RedondearNum";

export function CheckBoxNumber({ name, onCantidadChange, tipo }) {
  const [isChecked, setisChecked] = useState(false);
  const [Cantidad, setCantidad] = useState(0);

  const handleCheck = () => {
    setisChecked(!isChecked);
    if (!isChecked || !Cantidad) {
      setCantidad(0);
      onCantidadChange(tipo, 0);
    }
  };

  const handleCantidadChange = (e) => {
    const nuevaCantidad = parseInt(e.target.value, 10) || 0;
    setCantidad(redondearDecimales(nuevaCantidad, 2));
    onCantidadChange(tipo, redondearDecimales(nuevaCantidad, 2));
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
          <strong>{name}</strong>
        </label>
      </div>

      {isChecked && (
        <div className="mt-2">
          <label htmlFor={`${inputId}-input`} className="form-label">
            Ingrese el {name}:
          </label>
          <input
            type="number"
            className="form-control"
            id={`${inputId}-input`}
            placeholder="0"
            min="0"
            step="0.01"
            value={Cantidad}
            onChange={handleCantidadChange}
          />
        </div>
      )}
    </div>
  );
}
