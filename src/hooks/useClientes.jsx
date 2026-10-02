import { useState, useEffect, useCallback } from "react";
import { clientService } from "../services";
import Swal from "sweetalert2";

export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const records = await clientService.getClients({ sort: "Nombre" });
      setClientes(records);
      setError(null);
    } catch (err) {
      console.error("Error fetching clientes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCliente = async (clienteData) => {
    try {
      const record = await clientService.createClient(clienteData);

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
      const updated = await clientService.updateClient(id, data);
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
      await clientService.deleteClient(id);
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
    let isMounted = true;
    let unsubscribeFn = null;

    fetchClientes();

    const handleRealtime = (e) => {
      if (!isMounted) return;
      if (e.action === "create") {
        setClientes((prev) => {
          const next = [e.record, ...prev.filter((c) => c.id !== e.record.id)];
          return next.sort((a, b) => (a.Nombre || "").localeCompare(b.Nombre || ""));
        });
      } else if (e.action === "update") {
        setClientes((prev) =>
          prev.map((c) => (c.id === e.record.id ? e.record : c))
        );
      } else if (e.action === "delete") {
        setClientes((prev) => prev.filter((c) => c.id !== e.record.id));
      }
    };

    clientService
      .subscribe(handleRealtime)
      .then((unsub) => {
        if (!isMounted) {
          unsub();
        } else {
          unsubscribeFn = unsub;
        }
      })
      .catch((err) => {
        console.warn("PocketBase realtime error on Clientes:", err);
      });

    const handleUpdate = () => fetchClientes();
    window.addEventListener("clientes_updated", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("clientes_updated", handleUpdate);
      if (unsubscribeFn) {
        unsubscribeFn();
      } else {
        clientService.unsubscribe(handleRealtime).catch(() => {});
      }
    };
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
