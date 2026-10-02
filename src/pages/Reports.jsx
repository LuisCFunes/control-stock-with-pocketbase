import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SalesReport, CreditosReport } from "../components";

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "creditos" ? "creditos" : "ventas";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "creditos") {
      setActiveTab("creditos");
    } else if (tab === "ventas") {
      setActiveTab("ventas");
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div>
      {/* Navegación de pestañas de reportes */}
      <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-2">
        <button
          type="button"
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-medium ${
            activeTab === "ventas"
              ? "btn-primary shadow-sm"
              : "btn-outline-secondary border-0 bg-light text-dark"
          }`}
          onClick={() => handleTabChange("ventas")}
        >
          <i className="bi bi-graph-up-arrow"></i>
          <span>Reporte de Ventas</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 fw-medium ${
            activeTab === "creditos"
              ? "btn-primary shadow-sm"
              : "btn-outline-secondary border-0 bg-light text-dark"
          }`}
          onClick={() => handleTabChange("creditos")}
        >
          <i className="bi bi-wallet2"></i>
          <span>Cuentas por Cobrar</span>
        </button>
      </div>

      {/* Contenido del reporte activo */}
      {activeTab === "ventas" ? <SalesReport /> : <CreditosReport />}
    </div>
  );
}
