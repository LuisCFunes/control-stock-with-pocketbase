import { useEffect, useState } from "react";
import { pb, accessToken } from "../utilities/pocketbase_route";

export const useFactura = () => {
  const [facturas, setFacturas] = useState([]);
  const [errorState, setErrorState] = useState("");

  useEffect(() => {
    async function fetchFacturas() {
      try {
        pb.collection("Facturas").requestOptions = {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        };
        const data = await pb.collection("Facturas").getList(1, 1, {
          sort: "-Numero",
        });
        if (data != null) {
          setFacturas(data.items[0].Numero);
        }
      } catch (error) {
        setErrorState(error.message || "Error al obtener facturas");
      }
    }
    fetchFacturas();
  }, []);

  return { facturas, error: errorState };
};
