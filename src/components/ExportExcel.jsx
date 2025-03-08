import * as XLSX from "xlsx";
import { pb, accessToken } from "../utilities/pocketbase_route";

export function ExportButton({ tableName, buttonName, columns }) {
  const handleExport = async () => {
    pb.collection("Productos").requestOptions = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const data = await pb.collection("Productos").getFullList({
      sort: "-created",
    });

    let formattedData = data;
    if (tableName === "Facturas") {
      formattedData = data.map((item) => ({
        ...item,
        ProductosV: item.ProductosV
          ? item.ProductosV.map((Nombre) => Nombre.Nombre).join(", ")
          : "",
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData, { header: columns });
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, "datos.xlsx");
  };

  return <button onClick={handleExport}>{buttonName}</button>;
}
