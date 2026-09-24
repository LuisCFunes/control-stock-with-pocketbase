import { useState } from "react";
import { useClientes } from "../hooks/useClientes";
import Swal from "sweetalert2";

export default function Clientes() {
  const { clientes, loading, addCliente, updateCliente, deleteCliente } = useClientes();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    Nombre: "",
    RTN: "",
    Contacto: "",
    Telefono: "",
    Direccion: "",
    Email: "",
  });

  const filteredClientes = clientes.filter((c) => {
    const term = search.toLowerCase();
    return (
      (c.Nombre && c.Nombre.toLowerCase().includes(term)) ||
      (c.RTN && c.RTN.toLowerCase().includes(term)) ||
      (c.Contacto && c.Contacto.toLowerCase().includes(term)) ||
      (c.Telefono && c.Telefono.toLowerCase().includes(term))
    );
  });

  const handleResetForm = () => {
    setEditingId(null);
    setFormData({
      Nombre: "",
      RTN: "",
      Contacto: "",
      Telefono: "",
      Direccion: "",
      Email: "",
    });
  };

  const handleEditClick = (cliente) => {
    setEditingId(cliente.id);
    setFormData({
      Nombre: cliente.Nombre || "",
      RTN: cliente.RTN || "",
      Contacto: cliente.Contacto || "",
      Telefono: cliente.Telefono || "",
      Direccion: cliente.Direccion || "",
      Email: cliente.Email || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Nombre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El nombre del cliente es obligatorio.",
      });
      return;
    }

    try {
      if (editingId) {
        await updateCliente(editingId, formData);
        Swal.fire({
          icon: "success",
          title: "Cliente actualizado",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await addCliente(formData);
      }
      handleResetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (cliente) => {
    const result = await Swal.fire({
      title: "¿Eliminar cliente?",
      text: `¿Estás seguro de eliminar a ${cliente.Nombre}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteCliente(cliente.id);
        Swal.fire({
          icon: "success",
          title: "Eliminado",
          timer: 1500,
          showConfirmButton: false,
        });
        if (editingId === cliente.id) {
          handleResetForm();
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error al eliminar",
          text: err.message,
        });
      }
    }
  };

  return (
    <div className="row g-4">
      {/* Formulario Crear / Editar */}
      <div className="col-lg-4">
        <div className="app-card">
          <div className="card-header">
            <h5>
              <i className={`bi ${editingId ? "bi-pencil-square" : "bi-person-plus"} me-2 text-primary`}></i>
              {editingId ? "Editar Cliente" : "Registrar Cliente"}
            </h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Nombre o Razón Social *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Inversiones del Norte S.A."
                  value={formData.Nombre}
                  onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">RTN (14 dígitos)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: 08011990123456"
                  value={formData.RTN}
                  onChange={(e) => setFormData({ ...formData, RTN: e.target.value })}
                  maxLength={20}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Contacto</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Juan Pérez"
                  value={formData.Contacto}
                  onChange={(e) => setFormData({ ...formData, Contacto: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: 9988-7766"
                  value={formData.Telefono}
                  onChange={(e) => setFormData({ ...formData, Telefono: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: San Pedro Sula, Cortés"
                  value={formData.Direccion}
                  onChange={(e) => setFormData({ ...formData, Direccion: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="ejemplo@correo.com"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                />
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-app btn-primary-custom flex-fill">
                  <i className="bi bi-check-lg me-1"></i>
                  {editingId ? "Guardar cambios" : "Registrar"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleResetForm}
                    title="Cancelar edición"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="col-lg-8">
        <div className="app-card">
          <div className="card-header">
            <h5>
              <i className="bi bi-people me-2 text-primary"></i>
              Clientes Registrados
            </h5>
            <span className="badge bg-light text-dark border">
              {filteredClientes.length} {filteredClientes.length === 1 ? "cliente" : "clientes"}
            </span>
          </div>

          <div className="card-body">
            {/* Buscador */}
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre, RTN o teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="empty-state py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Cargando clientes...</p>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="empty-state py-4">
                <i className="bi bi-person-x"></i>
                <h5>No se encontraron clientes</h5>
                <p className="text-muted small">
                  {search ? "Prueba con otro término de búsqueda." : "Registra un cliente con el formulario."}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table-app">
                  <thead>
                    <tr className="text-center">
                      <th scope="col" style={{ width: "40px" }}>#</th>
                      <th scope="col" className="text-start">Nombre / Razón Social</th>
                      <th scope="col">RTN</th>
                      <th scope="col">Contacto</th>
                      <th scope="col">Teléfono</th>
                      <th scope="col">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientes.map((cli, idx) => (
                      <tr key={cli.id} className="text-center align-middle">
                        <td>{idx + 1}</td>
                        <td className="text-start fw-medium">
                          {cli.Nombre}
                          {cli.Direccion && (
                            <div className="text-muted small" style={{ fontSize: "11px" }}>
                              <i className="bi bi-geo-alt me-1"></i>
                              {cli.Direccion}
                            </div>
                          )}
                        </td>
                        <td>
                          {cli.RTN ? (
                            <span className="font-monospace small">{cli.RTN}</span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          {cli.Contacto ? (
                            <span className="small fw-medium">
                              <i className="bi bi-person me-1 text-muted"></i>
                              {cli.Contacto}
                            </span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>{cli.Telefono || <span className="text-muted small">—</span>}</td>
                        <td>
                          <div className="d-flex justify-content-center align-items-center gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEditClick(cli)}
                              title="Editar cliente"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(cli)}
                              title="Eliminar cliente"
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
