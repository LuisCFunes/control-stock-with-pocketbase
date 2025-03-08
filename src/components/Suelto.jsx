import { useState } from "react";
import useFacturarOperations from "../hooks/useFacturarOperations";
import useFacturarState from "../hooks/useFacturarState";

export default function Suelto() {
  const [money, setMoney] = useState(0);
  const { state } = useFacturarState();
  const { totalFactura } = useFacturarOperations(state);

  const handleSuelto = (e) => {
    setMoney(e.target.value);
  };

  return (
    <>
      {totalFactura !== 0 && (
        <>
          <input
            type="number"
            name="money"
            placeholder="Dinero que dio el cliente"
            onChange={handleSuelto}
          />
          <h3>Suelto: {money - totalFactura}</h3>
        </>
      )}
    </>
  );
}
