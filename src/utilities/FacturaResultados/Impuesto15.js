export default function Impuesto15(subtotal){
    const impuesto = subtotal * 0.15;
    const impuestoConDosDecimales = Math.round(impuesto * 100) / 100;
    return impuestoConDosDecimales;
}