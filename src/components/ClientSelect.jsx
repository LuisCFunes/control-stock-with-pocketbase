/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useClientes } from "../hooks/useClientes";

const MySwal = withReactContent(Swal);

export function ClientSelect({ cliente, rtn, onClienteChange, onRtnChange }) {
  const { clientes, loading, addCliente } = useClientes();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Filtrar clientes en tiempo real según lo que el usuario escribe
  const filtered = searchTerm.trim()
    ? clientes.filter((c) => {
        const term = searchTerm.toLowerCase();
        return (
          (c.Nombre && c.Nombre.toLowerCase().includes(term)) ||
          (c.RTN && c.RTN.toLowerCase().includes(term)) ||
          (c.Contacto && c.Contacto.toLowerCase().includes(term)) ||
          (c.Telefono && c.Telefono.toLowerCase().includes(term))
        );
      })
    : [];

  // Cerrar sugerencias al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectClient = (c) => {
    onClienteChange(c.Nombre);
    onRtnChange("rtnCliente", c.RTN || 0);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleSetConsumidorFinal = () => {
    onClienteChange("Consumidor Final");
    onRtnChange("rtnCliente", 0);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleOpenNewClientModal = async () => {
    setIsOpen(false);
    const { value: formValues } = await MySwal.fire({
      title: "Registrar Nuevo Cliente",
      html: `
        <div class="text-start">
          <div class="mb-3">
            <label class="form-label small fw-bold">Nombre o Razón Social *</label>
            <input id="swal-cli-nombre" class="form-control" placeholder="Ej: Distribuidora Central S.A." value="${searchTerm.trim()}" required>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">RTN (14 dígitos)</label>
            <input id="swal-cli-rtn" class="form-control" placeholder="Ej: 08011990123456" maxlength="20">
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Contacto</label>
            <input id="swal-cli-contacto" class="form-control" placeholder="Ej: Lic. Carlos Mendoza">
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Teléfono (opcional)</label>
            <input id="swal-cli-tel" class="form-control" placeholder="Ej: 9988-7766">
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Dirección (opcional)</label>
            <input id="swal-cli-dir" class="form-control" placeholder="Ej: Tegucigalpa, F.M.">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Guardar y Seleccionar',
      cancelButtonText: "Cancelar",
      focusConfirm: false,
      preConfirm: () => {
        const nombre = document.getElementById("swal-cli-nombre").value;
        const rtnVal = document.getElementById("swal-cli-rtn").value;
        const contacto = document.getElementById("swal-cli-contacto").value;
        const tel = document.getElementById("swal-cli-tel").value;
        const dir = document.getElementById("swal-cli-dir").value;

        if (!nombre || !nombre.trim()) {
          Swal.showValidationMessage("El nombre del cliente es obligatorio");
          return false;
        }

        return {
          Nombre: nombre.trim(),
          RTN: rtnVal.trim(),
          Contacto: contacto.trim(),
          Telefono: tel.trim(),
          Direccion: dir.trim(),
        };
      },
    });

    if (formValues) {
      try {
        const nuevo = await addCliente(formValues);
        if (nuevo) {
          handleSelectClient(nuevo);
        }
      } catch (e) {
        console.error("Error al guardar cliente:", e);
      }
    }
  };

  return (
    <div className="client-select-box" ref={containerRef}>
      {/* Buscador de clientes con autocompletado en vivo */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="flex-grow-1 position-relative" style={{ minWidth: "240px" }}>
          <div className="input-group">
            <span className="input-group-text bg-white text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar cliente por nombre o RTN..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (searchTerm.trim()) setIsOpen(true);
              }}
              disabled={loading}
            />
            {searchTerm && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setIsOpen(false);
                }}
                title="Limpiar búsqueda"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>

          {/* Menú flotante de sugerencias */}
          {isOpen && searchTerm.trim().length > 0 && (
            <div
              className="position-absolute start-0 end-0 bg-white border rounded shadow-lg mt-1"
              style={{
                zIndex: 1050,
                maxHeight: "260px",
                overflowY: "auto",
              }}
            >
              {filtered.length > 0 ? (
                <div className="list-group list-group-flush">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="list-group-item list-group-item-action text-start py-2 px-3"
                      onClick={() => handleSelectClient(c)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-dark">{c.Nombre}</span>
                        {c.RTN && (
                          <span className="badge bg-light text-primary border ms-2">
                            RTN: {c.RTN}
                          </span>
                        )}
                      </div>
                      {(c.Contacto || c.Telefono || c.Direccion) && (
                        <div className="text-muted small mt-1" style={{ fontSize: "11px" }}>
                          {c.Contacto && (
                            <span className="me-3">
                              <i className="bi bi-person me-1"></i>
                              {c.Contacto}
                            </span>
                          )}
                          {c.Telefono && (
                            <span className="me-3">
                              <i className="bi bi-telephone me-1"></i>
                              {c.Telefono}
                            </span>
                          )}
                          {c.Direccion && (
                            <span>
                              <i className="bi bi-geo-alt me-1"></i>
                              {c.Direccion}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-muted small">
                  <i className="bi bi-person-x fs-5 d-block mb-1"></i>
                  No se encontraron clientes con &ldquo;<strong>{searchTerm}</strong>&rdquo;.
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary py-1 px-2"
                      onClick={handleOpenNewClientModal}
                    >
                      <i className="bi bi-person-plus me-1"></i>
                      Registrar como nuevo cliente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
            onClick={handleOpenNewClientModal}
            title="Crear y registrar nuevo cliente"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>+ Nuevo</span>
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleSetConsumidorFinal}
            title="Asignar Consumidor Final"
          >
            Consumidor Final
          </button>
        </div>
      </div>

      {/* Visualización de solo lectura del cliente seleccionado (sin textboxes) */}
      <div className="p-3 bg-light rounded border d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <span className="text-muted small d-block mb-1">
            <i className="bi bi-person-check-fill text-success me-1"></i>
            Cliente asignado a la factura:
          </span>
          <span className="fw-bold fs-6 text-dark">
            {cliente || "Consumidor Final"}
          </span>
        </div>

        <div className="text-sm-end">
          <span className="text-muted small d-block mb-1">
            <i className="bi bi-card-text me-1"></i>
            RTN:
          </span>
          {rtn && rtn !== 0 ? (
            <span
              className="badge bg-white text-dark border font-monospace px-3 py-2 fw-bold shadow-sm"
              style={{ fontSize: "14.5px", letterSpacing: "0.05em" }}
            >
              {rtn}
            </span>
          ) : (
            <span
              className="badge bg-white text-muted border font-monospace px-3 py-2"
              style={{ fontSize: "13px" }}
            >
              — Sin RTN —
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
