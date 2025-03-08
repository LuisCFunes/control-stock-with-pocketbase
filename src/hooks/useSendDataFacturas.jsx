import { pb, accessToken } from "../utilities/pocketbase_route";

export const useSendData = (
  Numero,
  Cliente,
  Total,
  Tabla,
  ProductosV,
  Estado = true,
) => {
  async function putData() {
    const datos = { Numero, Cliente, Total, ProductosV, Estado };
    if (datos.Cliente === "" && datos.Total === "" && datos.ProductosV === "") {
      alert("No hay datos para enviar");
      return;
    } else {
      try {
        pb.collection(Tabla).requestOptions = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        };
        const records = await pb.collection(Tabla).create(datos);
        console.log(records.created);
        console.log("Se envió correctamente");
      } catch (error) {
        console.error("Error de envío", error);
        console.log(datos);
        return;
      }
    }
  }

  return { putData };
};
