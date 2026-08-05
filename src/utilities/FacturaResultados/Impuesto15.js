import redondearDecimales from "../RedondearNum";

export default function Impuesto15(base15){
    const impuesto = base15 * 0.15;
    return redondearDecimales(impuesto, 2);
}