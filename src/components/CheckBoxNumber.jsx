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

  return (
    <div className="d-flex">
      <label htmlFor="checkbox" className="mx-2 p-0 my-auto text-primary">
        <input
          type="checkbox"
          id="checkbox"
          name="nombreDescriptivo"
          checked={isChecked}
          onChange={handleCheck}
        />
        <strong>{name}</strong>
      </label>

      {isChecked && (
        <div>
          <label htmlFor="numberInput"> Ingrese el {name}:</label>
          <input type="number" onChange={handleCantidadChange} />
        </div>
      )}
    </div>
  );
}
