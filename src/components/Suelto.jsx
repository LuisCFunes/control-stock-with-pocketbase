/* eslint-disable react/prop-types */
import { useState } from "react";

export default function Suelto({ totalFactura }) {
  const [money, setMoney] = useState(0);
  const change = money - totalFactura;

  const handleSuelto = (e) => {
    setMoney(Number(e.target.value));
  };

  return (
    <>
      {totalFactura !== 0 && (
        <div className="bg-light border rounded p-3 text-start">
          <label htmlFor="money" className="form-label">
            Dinero recibido (Lps.)
          </label>
          <input
            type="number"
            id="money"
            name="money"
            className="form-control"
            placeholder="0.00"
            min="0"
            step="0.01"
            onChange={handleSuelto}
          />
          <div className="d-flex justify-content-between mt-3">
            <span className="text-muted">Cambio:</span>
            <span
              className={`fw-bold ${change < 0 ? "text-danger" : "text-success"}`}
            >
              L. {change.toLocaleString("es-HN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
