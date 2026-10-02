import { pb } from "../utilities/pocketbase_route";

export const clientService = {
  /**
   * Fetch all clients sorted by name by default.
   */
  async getClients({ sort = "Nombre", filter = "" } = {}) {
    const options = { sort };
    if (filter) options.filter = filter;
    return await pb.collection("Clientes").getFullList(options);
  },

  /**
   * Fetch a single client by ID.
   */
  async getClientById(id) {
    return await pb.collection("Clientes").getOne(id);
  },

  /**
   * Create a new client with validations.
   */
  async createClient({ Nombre, RTN, Contacto, Telefono, Direccion, Email }) {
    const trimmedName = (Nombre || "").trim();
    if (!trimmedName) {
      throw new Error("Client name cannot be empty.");
    }

    const payload = {
      Nombre: trimmedName,
      RTN: (RTN || "").trim(),
      Contacto: (Contacto || "").trim(),
      Telefono: (Telefono || "").trim(),
      Direccion: (Direccion || "").trim(),
      Email: (Email || "").trim(),
    };

    return await pb.collection("Clientes").create(payload);
  },

  /**
   * Update an existing client.
   */
  async updateClient(id, data) {
    if (!id) throw new Error("Client ID is required for update.");
    return await pb.collection("Clientes").update(id, data);
  },

  /**
   * Delete a client by ID.
   */
  async deleteClient(id) {
    if (!id) throw new Error("Client ID is required for delete.");
    return await pb.collection("Clientes").delete(id);
  },

  /**
   * Subscribe to real-time events on Clientes collection.
   */
  async subscribe(callback) {
    return await pb.collection("Clientes").subscribe("*", callback);
  },

  /**
   * Unsubscribe from Clientes real-time events.
   */
  async unsubscribe(callback) {
    if (callback) {
      return await pb.collection("Clientes").unsubscribe("*", callback);
    }
    return await pb.collection("Clientes").unsubscribe("*");
  },
};
