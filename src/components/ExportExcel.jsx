/* eslint-disable react/prop-types */
import * as XLSX from "xlsx";
import { pb } from "../utilities/pocketbase_route";

export function ExportButton({ tableName, buttonName, columns }) {
  const handleExport = async () => {
    const collection = tableName || "Productos";
    const data = await pb.collection(collection).getFullList({
      sort: "-created",
    });

    let formattedData = data;
    if (collection === "Facturas") {
      formattedData = data.map((item) => ({
        ...item,
        ProductosV: item.ProductosV
          ? item.ProductosV.map((prod) => prod.Nombre).join(", ")
          : "",
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData, { header: columns });
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `datos_${collection}.xlsx`);
  };

  return <button onClick={handleExport}>{buttonName}</button>;
}
