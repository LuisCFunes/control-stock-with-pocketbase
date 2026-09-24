/* eslint-disable react/prop-types */
import { pb } from "../utilities/pocketbase_route";
import { exportStyledExcel } from "../utilities/excelHelper";

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

    const cols =
      columns && columns.length > 0
        ? columns.map((col) =>
            typeof col === "string" ? { key: col, header: col } : col
          )
        : Object.keys(formattedData[0] || {}).map((key) => ({
            key,
            header: key,
          }));

    exportStyledExcel({
      fileName: `datos_${collection}.xlsx`,
      sheetName: collection,
      columns: cols,
      data: formattedData,
    });
  };

  return <button onClick={handleExport}>{buttonName}</button>;
}
