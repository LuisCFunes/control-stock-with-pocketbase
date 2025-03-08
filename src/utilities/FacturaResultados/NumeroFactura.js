import { useFactura } from "../../hooks/useFactura";

export default function NumeroFactura() {
  const { facturas } = useFactura();

  const lastId = facturas || 0;
  
  return lastId + 1;

}
