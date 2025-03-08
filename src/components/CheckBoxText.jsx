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
        <strong>{tipo}</strong>
      </label>

      {isChecked && (
        <div>
          <label htmlFor="numberInput"> Ingrese el {tipo}:</label>
          <input type="text" onChange={handleTextChange} />
        </div>
      )}
    </div>
  );
}
