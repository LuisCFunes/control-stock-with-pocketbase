import { ExportButton } from "../components";

export default function Reports() {
  return (
    <>
      <h1 className="text-center">Reportes</h1>
      <div className="text-center">
        <ExportButton
          tableName={"Facturas"}
          buttonName={"Facturas"}
          columns={["id", "created", "Cliente", "Total", "ProductosV"]}
        />
        <ExportButton
          tableName={"Productos"}
          buttonName={"Productos"}
          columns={["id", "Nombre", "Cantidad", "Precio"]}
        />
      </div>
    </>
  );
}
