import { useState, useEffect, useCallback } from "react";
import { pb } from "../utilities/pocketbase_route";
import Swal from "sweetalert2";

export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const records = await pb.collection("Clientes").getFullList({
        sort: "Nombre",
      });
      setClientes(records);
      setError(null);
    } catch (err) {
      console.error("Error fetching clientes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCliente = async ({ Nombre, RTN, Contacto, Telefono, Direccion, Email }) => {
    try {
      const record = await pb.collection("Clientes").create({
        Nombre: Nombre.trim(),
        RTN: RTN ? RTN.trim() : "",
        Contacto: Contacto ? Contacto.trim() : "",
        Telefono: Telefono ? Telefono.trim() : "",
        Direccion: Direccion ? Direccion.trim() : "",
        Email: Email ? Email.trim() : "",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("clientes_updated"));
      }

      Swal.fire({
        icon: "success",
        title: "Cliente registrado",
        text: `El cliente ${record.Nombre} se guardó exitosamente.`,
        timer: 2000,
        showConfirmButton: false,
      });

      await fetchClientes();
      return record;
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error al registrar cliente",
        text: err.message || "No se pudo guardar el cliente",
      });
      throw err;
    }
  };

  const updateCliente = async (id, data) => {
    try {
      const updated = await pb.collection("Clientes").update(id, data);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("clientes_updated"));
      }
      await fetchClientes();
      return updated;
    } catch (err) {
      console.error("Error updating cliente:", err);
      throw err;
    }
  };

  const deleteCliente = async (id) => {
    try {
      await pb.collection("Clientes").delete(id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("clientes_updated"));
      }
      await fetchClientes();
    } catch (err) {
      console.error("Error deleting cliente:", err);
      throw err;
    }
  };

  useEffect(() => {
    fetchClientes();
    const handleUpdate = () => fetchClientes();
    window.addEventListener("clientes_updated", handleUpdate);
    return () => window.removeEventListener("clientes_updated", handleUpdate);
  }, [fetchClientes]);

  return {
    clientes,
    loading,
    error,
    reload: fetchClientes,
    addCliente,
    updateCliente,
    deleteCliente,
  };
};
