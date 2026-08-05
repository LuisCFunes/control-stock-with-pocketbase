import redondearDecimales from "../RedondearNum";

export default function ISV18(base18) {
  const impuesto = base18 * 0.18;
  return redondearDecimales(impuesto, 2);
}
