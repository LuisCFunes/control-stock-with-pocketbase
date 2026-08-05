import redondearDecimales from "../RedondearNum";

export default function Base15(subtotal, base18) {
  const base = Math.max(subtotal - base18, 0);
  return redondearDecimales(base, 2);
}
