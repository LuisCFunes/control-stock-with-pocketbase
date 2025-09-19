import { useState } from "react";
import { pb, accessToken } from "../utilities/pocketbase_route";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export function SalesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      pb.collection("Facturas").requestOptions = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };

      let filter = "";
      if (startDate) filter += `created >= "${startDate}T00:00:00.000Z"`;
      if (endDate) {
        if (filter) filter += " && ";
        filter += `created <= "${endDate}T23:59:59.999Z"`;
      }
      if (customerFilter) {
        if (filter) filter += " && ";
        filter += `Cliente ~ "${customerFilter}"`;
      }

      const records = await pb.collection("Facturas").getFullList({
        filter: filter || undefined,
        sort: "-created",
      });

      // Aggregate data
      const totalSales = records.reduce((sum, r) => sum + r.Total, 0);
      const numTransactions = records.length;
      const itemized = records.flatMap(r =>
        r.ProductosV.map(p => ({
          invoiceId: r.id,
          invoiceNumber: r.Numero,
          date: r.created,
          customer: r.Cliente,
          product: p.Nombre,
          quantity: p.Cantidad,
          price: p.Precio,
          total: p.Cantidad * p.Precio,
          discount: r.discount_amount || 0,
        }))
      );

      setReportData({
        totalSales,
        numTransactions,
        itemized,
        records,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    const data = reportData.itemized.map(item => ({
      "Factura ID": item.invoiceId,
      "Número": item.invoiceNumber,
      "Fecha": item.date,
      "Cliente": item.customer,
      "Producto": item.product,
      "Cantidad": item.quantity,
      "Precio": item.price,
      "Total": item.total,
      "Descuento": item.discount,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte de Ventas");
    XLSX.writeFile(wb, "reporte_ventas.csv");
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.text("Reporte de Ventas", 20, 10);
    doc.text(`Fecha: ${startDate} - ${endDate}`, 20, 20);
    doc.text(`Total Ventas: ${reportData.totalSales}`, 20, 30);
    doc.text(`Número de Transacciones: ${reportData.numTransactions}`, 20, 40);

    const tableData = reportData.itemized.map(item => [
      item.invoiceNumber,
      item.date.split('T')[0],
      item.customer,
      item.product,
      item.quantity,
      item.price,
      item.total,
    ]);

    doc.autoTable({
      head: [['Factura', 'Fecha', 'Cliente', 'Producto', 'Cant.', 'Precio', 'Total']],
      body: tableData,
      startY: 50,
    });

    doc.save("reporte_ventas.pdf");
  };

  return (
    <div className="container mt-4">
      <h3>Reporte de Ventas</h3>
      <div className="row mb-3">
        <div className="col-md-3">
          <label>Fecha Inicio:</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label>Fecha Fin:</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label>Cliente:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Filtrar por cliente"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </div>
      </div>
      <button className="btn btn-primary mb-3" onClick={generateReport} disabled={loading}>
        {loading ? "Generando..." : "Generar Reporte"}
      </button>

      {reportData && (
        <>
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5>Total Ventas</h5>
                  <p className="h4">{reportData.totalSales.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5>Número de Transacciones</h5>
                  <p className="h4">{reportData.numTransactions}</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h5>Productos Vendidos</h5>
                  <p className="h4">{reportData.itemized.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <button className="btn btn-success me-2" onClick={exportCSV}>Exportar CSV</button>
            <button className="btn btn-danger" onClick={exportPDF}>Exportar PDF</button>
          </div>

          <table className="table table-striped">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {reportData.itemized.map((item, index) => (
                <tr key={index}>
                  <td>{item.invoiceNumber}</td>
                  <td>{item.date.split('T')[0]}</td>
                  <td>{item.customer}</td>
                  <td>{item.product}</td>
                  <td>{item.quantity}</td>
                  <td>{item.price}</td>
                  <td>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}