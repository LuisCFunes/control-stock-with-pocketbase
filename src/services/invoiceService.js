import { pb } from "../utilities/pocketbase_route";

export const invoiceService = {
  /**
   * Get the next sequential invoice number.
   */
  async getNextInvoiceNumber() {
    try {
      const records = await pb.collection("Facturas").getList(1, 1, {
        sort: "-Numero",
        requestKey: null,
      });
      const lastNumero = records.items[0]?.Numero || 0;
      return lastNumero + 1;
    } catch (err) {
      console.error("Failed to query next invoice number:", err);
      return 1;
    }
  },

  /**
   * Fetch invoices with optional filtering and sorting.
   */
  async getInvoices({ filter = "", sort = "-created", expand = "" } = {}) {
    const options = { sort };
    if (filter) options.filter = filter;
    if (expand) options.expand = expand;
    return await pb.collection("Facturas").getFullList(options);
  },

  /**
   * Create a new invoice record.
   */
  async createInvoice(invoiceData) {
    if (!invoiceData.ProductosV || invoiceData.ProductosV.length === 0) {
      throw new Error("Cannot create invoice without items.");
    }

    const payload = {
      Numero: Number(invoiceData.Numero),
      Cliente: invoiceData.Cliente || "Consumidor Final",
      Total: Number(invoiceData.Total || 0),
      ProductosV: invoiceData.ProductosV,
      Estado: invoiceData.Estado ?? true,
      discount_amount: Number(invoiceData.discount_amount || 0),
      exonerado_amount: Number(invoiceData.exonerado_amount || 0),
      exento_amount: Number(invoiceData.exento_amount || 0),
      condicion: invoiceData.condicion || "Contado",
      formapago: invoiceData.formapago || "Efectivo",
      detalle: invoiceData.detalle || "",
      observacion: invoiceData.observacion || "",
      subtotal15: Number(invoiceData.subtotal15 || 0),
      isv15: Number(invoiceData.isv15 || 0),
      subtotal18: Number(invoiceData.subtotal18 || 0),
      isv18: Number(invoiceData.isv18 || 0),
      RTN: invoiceData.RTN || "",
      estado_pago:
        invoiceData.estado_pago ||
        (invoiceData.condicion === "Credito" ? "Pendiente" : "Pagada"),
      saldo_pendiente:
        invoiceData.saldo_pendiente !== undefined
          ? Number(invoiceData.saldo_pendiente)
          : invoiceData.condicion === "Credito"
            ? Number(invoiceData.Total || 0)
            : 0,
      dias_credito: Number(invoiceData.dias_credito || 0),
      fecha_vencimiento: invoiceData.fecha_vencimiento || "",
      abonos: invoiceData.abonos || [],
    };

    return await pb.collection("Facturas").create(payload);
  },

  /**
   * Update an existing invoice.
   */
  async updateInvoice(id, data) {
    return await pb.collection("Facturas").update(id, data);
  },

  /**
   * Record a payment/abono on a credit invoice.
   */
  async recordPayment(invoice, { monto, formapago, referencia, nota }) {
    const paymentAmount = Number(monto);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    const currentBalance = Number(invoice.saldo_pendiente || 0);
    if (paymentAmount > currentBalance + 0.01) {
      throw new Error(
        `Payment amount (L. ${paymentAmount.toFixed(2)}) exceeds pending balance (L. ${currentBalance.toFixed(2)}).`,
      );
    }

    const newPayment = {
      id: `abn_${Date.now()}`,
      fecha: new Date().toISOString(),
      monto: paymentAmount,
      formapago: (formapago || "Efectivo").trim(),
      referencia: (referencia || "").trim(),
      nota: (nota || "").trim(),
    };

    const updatedPayments = [...(invoice.abonos || []), newPayment];
    const newBalance = Math.max(0, Math.round((currentBalance - paymentAmount) * 100) / 100);
    const newStatus = newBalance <= 0.009 ? "Pagada" : "Abonado";

    const updatedRecord = await pb.collection("Facturas").update(invoice.id, {
      abonos: updatedPayments,
      saldo_pendiente: newBalance,
      estado_pago: newStatus,
    });

    return {
      record: updatedRecord,
      newPayment,
      newBalance,
      newStatus,
    };
  },

  /**
   * Subscribe to real-time events on Facturas.
   */
  async subscribe(callback) {
    return await pb.collection("Facturas").subscribe("*", callback);
  },

  /**
   * Unsubscribe from Facturas real-time events.
   */
  async unsubscribe(callback) {
    if (callback) {
      return await pb.collection("Facturas").unsubscribe("*", callback);
    }
    return await pb.collection("Facturas").unsubscribe("*");
  },
};
