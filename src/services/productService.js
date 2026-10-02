import { pb } from "../utilities/pocketbase_route";

export class InsufficientStockError extends Error {
  constructor(productName, availableStock, requestedQuantity) {
    super(
      `Insufficient stock for "${productName}". Available: ${availableStock}, Requested: ${requestedQuantity}`,
    );
    this.name = "InsufficientStockError";
    this.productName = productName;
    this.availableStock = availableStock;
    this.requestedQuantity = requestedQuantity;
  }
}

export const productService = {
  /**
   * Fetch all products sorted and optionally filtered.
   */
  async getProducts({ sort = "-created", filter = "" } = {}) {
    const options = { sort };
    if (filter) options.filter = filter;
    return await pb.collection("Productos").getFullList(options);
  },

  /**
   * Fetch a single product by ID.
   */
  async getProductById(id) {
    return await pb.collection("Productos").getOne(id);
  },

  /**
   * Create a new product with domain validations.
   */
  async createProduct({
    Nombre,
    Cantidad = 0,
    Precio_Compra = 0,
    Precio_Venta = 0,
    Categoria = "General",
    Estado = true,
  }) {
    const trimmedName = (Nombre || "").trim();
    if (!trimmedName) {
      throw new Error("Product name cannot be empty.");
    }

    const qty = Number(Cantidad);
    const pBuy = Number(Precio_Compra);
    const pSell = Number(Precio_Venta);

    if (qty < 0 || pBuy < 0 || pSell < 0) {
      throw new Error("Quantity and prices cannot be negative values.");
    }

    const payload = {
      Nombre: trimmedName,
      Cantidad: qty,
      Precio_Compra: pBuy,
      Precio_Venta: pSell,
      Precio: pSell,
      Categoria: (Categoria || "General").trim(),
      Estado: Estado ?? true,
    };

    return await pb.collection("Productos").create(payload);
  },

  /**
   * Update an existing product.
   */
  async updateProduct(id, data) {
    if (!id) throw new Error("Product ID is required for update.");

    const payload = { ...data };
    if (payload.Nombre !== undefined) payload.Nombre = payload.Nombre.trim();
    if (payload.Precio_Venta !== undefined) {
      payload.Precio_Venta = Number(payload.Precio_Venta);
      payload.Precio = payload.Precio_Venta;
    }
    if (payload.Precio_Compra !== undefined) {
      payload.Precio_Compra = Number(payload.Precio_Compra);
    }
    if (payload.Cantidad !== undefined) {
      payload.Cantidad = Number(payload.Cantidad);
    }

    return await pb.collection("Productos").update(id, payload);
  },

  /**
   * Delete a product by ID.
   */
  async deleteProduct(id) {
    if (!id) throw new Error("Product ID is required for delete.");
    return await pb.collection("Productos").delete(id);
  },

  /**
   * Decrement stock verifying concurrency and ensuring non-negative balance.
   */
  async decrementStock(id, quantityToDeduct) {
    const qtyToDeduct = Number(quantityToDeduct || 0);
    if (qtyToDeduct <= 0) return null;

    const fresh = await pb.collection("Productos").getOne(id, { requestKey: null });
    const currentStock = Number(fresh.Cantidad || 0);

    if (currentStock < qtyToDeduct) {
      throw new InsufficientStockError(fresh.Nombre, currentStock, qtyToDeduct);
    }

    const newStock = currentStock - qtyToDeduct;
    return await pb.collection("Productos").update(id, { Cantidad: newStock });
  },

  /**
   * Subscribe to real-time events on the Productos collection.
   */
  async subscribe(callback) {
    return await pb.collection("Productos").subscribe("*", callback);
  },

  /**
   * Unsubscribe a specific listener or all listeners.
   */
  async unsubscribe(callback) {
    if (callback) {
      return await pb.collection("Productos").unsubscribe("*", callback);
    }
    return await pb.collection("Productos").unsubscribe("*");
  },
};
