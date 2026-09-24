/* eslint-disable react/prop-types */
import { useState, useMemo, useEffect } from "react";
import Swal from "sweetalert2";
import {
  extractCategories,
  saveCustomCategory,
  deleteCategoryWithProducts,
  restoreDefaultCategories,
  getDeletedCategories,
  countProductsByCategory,
} from "../utilities/categories";

export const CategorySelect = ({
  value = "General",
  onChange,
  products = [],
  id = "categoriaSelect",
  label = "Categoría",
}) => {
  const [sessionCategories, setSessionCategories] = useState([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageFilter, setManageFilter] = useState("");
  const [newCatInput, setNewCatInput] = useState("");
  const [categoriesVersion, setCategoriesVersion] = useState(0);

  // Escuchar cuando las categorías se actualicen externamente
  useEffect(() => {
    const handleUpdate = () => setCategoriesVersion((v) => v + 1);
    window.addEventListener("categories_updated", handleUpdate);
    return () => window.removeEventListener("categories_updated", handleUpdate);
  }, []);

  // Combina categorías base, guardadas en storage y en productos (excluyendo eliminadas)
  const allCategories = useMemo(() => {
    void categoriesVersion;
    const base = extractCategories(products);
    const deletedSet = new Set(
      getDeletedCategories().map((c) => c.toLowerCase().trim())
    );

    const set = new Set([...base, ...sessionCategories]);
    if (value && typeof value === "string" && value.trim() !== "") {
      const trimmedValue = value.trim();
      if (!deletedSet.has(trimmedValue.toLowerCase())) {
        set.add(trimmedValue);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [products, sessionCategories, value, categoriesVersion]);

  // Contar productos por categoría para mostrar métricas informativas
  const productCounts = useMemo(() => {
    return countProductsByCategory(products);
  }, [products]);

  // Manejar creación rápida con Swal
  const handleCreateCategory = async () => {
    const { value: newCat } = await Swal.fire({
      title: "Nueva Categoría",
      input: "text",
      inputLabel: "Ingresa el nombre de la nueva categoría:",
      inputPlaceholder: "Ej: Ferretería, Farmacia, Repostería...",
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4f46e5",
      inputValidator: (val) => {
        if (!val || !val.trim()) {
          return "Debes ingresar un nombre para la categoría";
        }
      },
    });

    if (newCat && newCat.trim()) {
      const formatted = saveCustomCategory(newCat);
      if (formatted) {
        setSessionCategories((prev) => Array.from(new Set([...prev, formatted])));
        onChange(formatted);
        Swal.fire({
          icon: "success",
          title: "Categoría lista",
          text: `Se seleccionó "${formatted}" para este producto`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    }
  };

  // Manejar eliminación con confirmación y reasignación de productos existentes
  const handleDeleteCategory = async (catToDelete) => {
    if (!catToDelete || catToDelete.trim().toLowerCase() === "general") {
      Swal.fire({
        icon: "info",
        title: "Categoría protegida",
        text: "La categoría 'General' es la categoría predeterminada del sistema y no se puede eliminar.",
        confirmButtonColor: "#4f46e5",
      });
      return;
    }

    const trimmed = catToDelete.trim();
    const count = productCounts[trimmed] || 0;

    const result = await Swal.fire({
      title: `¿Eliminar categoría "${trimmed}"?`,
      html:
        count > 0
          ? `Esta categoría tiene <b>${count} producto(s)</b> asignado(s).<br/><br/>Si la eliminas, todos esos productos se reasignarán automáticamente a la categoría <b>General</b>.`
          : `Esta categoría no tiene productos asignados actualmente.<br/><br/>¿Estás seguro de que deseas eliminarla?`,
      icon: count > 0 ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: count > 0 ? "Sí, eliminar y reasignar" : "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: "Eliminando categoría...",
        text: count > 0 ? "Reasignando productos en la base de datos..." : "Procesando...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const res = await deleteCategoryWithProducts(trimmed, products);
        if (res.success) {
          if (value && value.trim().toLowerCase() === trimmed.toLowerCase()) {
            onChange("General");
          }
          setSessionCategories((prev) =>
            prev.filter((c) => c.toLowerCase() !== trimmed.toLowerCase())
          );

          Swal.fire({
            icon: "success",
            title: "Categoría eliminada",
            text:
              count > 0
                ? `La categoría "${trimmed}" fue eliminada y ${count} producto(s) se reasignaron a "General".`
                : `La categoría "${trimmed}" fue eliminada con éxito.`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("Error al eliminar categoría:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo completar la eliminación de la categoría.",
        });
      }
    }
  };

  // Creación desde el modal
  const handleModalAddCategory = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    const formatted = saveCustomCategory(trimmed);
    if (formatted) {
      setSessionCategories((prev) => Array.from(new Set([...prev, formatted])));
      onChange(formatted);
      setNewCatInput("");
      setCategoriesVersion((v) => v + 1);
      Swal.fire({
        icon: "success",
        title: "Categoría agregada",
        text: `Se agregó la categoría "${formatted}" con éxito.`,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // Restaurar categorías por defecto si se habían eliminado
  const handleRestoreDefaults = async () => {
    const result = await Swal.fire({
      title: "¿Restablecer categorías originales?",
      text: "Esto volverá a mostrar las categorías predeterminadas del sistema que hayas eliminado.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restablecer",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#4f46e5",
    });

    if (result.isConfirmed) {
      restoreDefaultCategories();
      Swal.fire({
        icon: "success",
        title: "Restablecidas",
        text: "Las categorías iniciales del sistema han sido restablecidas.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const hasDeletedCategories = getDeletedCategories().length > 0;

  // Filtrado de categorías dentro del modal de administración
  const filteredModalCategories = allCategories.filter((cat) =>
    cat.toLowerCase().includes(manageFilter.toLowerCase().trim())
  );

  const isCurrentGeneral = !value || value.trim().toLowerCase() === "general";

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={id} className="form-label d-flex justify-content-between align-items-center">
          <span>{label}</span>
          <span className="text-muted small" style={{ fontSize: "11px" }}>
            {allCategories.length} disponibles
          </span>
        </label>
      )}

      <div className="input-group">
        <span className="input-group-text bg-white text-muted">
          <i className="bi bi-tag"></i>
        </span>

        <select
          id={id}
          className="form-select"
          value={value || "General"}
          onChange={(e) => {
            const selectedVal = e.target.value;
            if (selectedVal === "__NEW__") {
              handleCreateCategory();
            } else if (selectedVal === "__MANAGE__") {
              setIsManageModalOpen(true);
            } else {
              onChange(selectedVal);
            }
          }}
        >
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option disabled>──────────</option>
          <option value="__NEW__">➕ Nueva categoría...</option>
          <option value="__MANAGE__">⚙️ Administrar categorías...</option>
        </select>

        {/* Botón Nueva */}
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleCreateCategory}
          title="Crear nueva categoría"
        >
          <i className="bi bi-plus-lg me-1"></i>
          <span className="d-none d-sm-inline">Nueva</span>
        </button>

        {/* Botón Eliminar categoría seleccionada */}
        <button
          type="button"
          className={`btn ${
            isCurrentGeneral ? "btn-outline-secondary" : "btn-outline-danger"
          }`}
          onClick={() => handleDeleteCategory(value)}
          disabled={isCurrentGeneral}
          title={
            isCurrentGeneral
              ? "La categoría 'General' no se puede eliminar"
              : `Eliminar categoría "${value}"`
          }
        >
          <i className="bi bi-trash3"></i>
        </button>

        {/* Botón Gestionar todas las categorías */}
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setIsManageModalOpen(true)}
          title="Administrar todas las categorías"
        >
          <i className="bi bi-gear"></i>
        </button>
      </div>

      {/* Modal para Administrar / Eliminar Categorías */}
      {isManageModalOpen && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-light">
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="bi bi-tags me-2 text-primary"></i>
                  Administrar Categorías
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsManageModalOpen(false)}
                  aria-label="Cerrar"
                ></button>
              </div>

              <div className="modal-body p-3">
                {/* Formulario de agregar rápido */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">
                    Agregar nueva categoría
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Repostería, Accesorios..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleModalAddCategory(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!newCatInput.trim()}
                      onClick={(e) => handleModalAddCategory(e)}
                    >
                      <i className="bi bi-plus-lg me-1"></i>
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Filtro de búsqueda en la lista de categorías */}
                <div className="mb-2">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white text-muted">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filtrar categorías..."
                      value={manageFilter}
                      onChange={(e) => setManageFilter(e.target.value)}
                    />
                    {manageFilter && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setManageFilter("")}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Lista de categorías */}
                <div
                  className="list-group list-group-flush border rounded"
                  style={{ maxHeight: "280px", overflowY: "auto" }}
                >
                  {filteredModalCategories.length === 0 ? (
                    <div className="p-3 text-center text-muted small">
                      No se encontraron categorías
                    </div>
                  ) : (
                    filteredModalCategories.map((cat) => {
                      const count = productCounts[cat] || 0;
                      const isGeneral = cat.toLowerCase() === "general";
                      const isCurrent = value && value.toLowerCase() === cat.toLowerCase();

                      return (
                        <div
                          key={cat}
                          className={`list-group-item d-flex justify-content-between align-items-center py-2 px-3 ${
                            isCurrent ? "bg-light" : ""
                          }`}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-medium text-dark">{cat}</span>
                            {isCurrent && (
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle small">
                                Seleccionada
                              </span>
                            )}
                            <span className="badge bg-light text-secondary border small">
                              {count} {count === 1 ? "producto" : "productos"}
                            </span>
                          </div>

                          <div>
                            {isGeneral ? (
                              <span
                                className="badge bg-secondary-subtle text-secondary small"
                                title="Categoría fija del sistema"
                              >
                                Fija
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                title={`Eliminar categoría "${cat}"`}
                                onClick={() => handleDeleteCategory(cat)}
                              >
                                <i className="bi bi-trash3 me-1"></i>
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light justify-content-between py-2">
                <div>
                  {hasDeletedCategories && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none text-muted p-0"
                      onClick={handleRestoreDefaults}
                      title="Restaurar categorías por defecto del sistema que fueron eliminadas"
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                      Restablecer predeterminadas
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setIsManageModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
