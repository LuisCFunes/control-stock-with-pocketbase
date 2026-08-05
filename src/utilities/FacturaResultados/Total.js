import redondearDecimales from "../RedondearNum";

export default function Total(base15, isv15, base18, isv18, exento, exonerado, descuento) {
  let total = base15 + isv15 + base18 + isv18 + exento + exonerado;
  if (descuento) {
    total = total - descuento;
  }
  return redondearDecimales(Math.max(total, 0), 2);
}
