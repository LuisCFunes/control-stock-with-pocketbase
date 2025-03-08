import redondearDecimales from "../RedondearNum";

export default function Total(subtotal, impuesto,descuento) {
  let total = subtotal + impuesto;
  if(descuento){
    total = total - descuento;
    return redondearDecimales(total,2) ; 
  }else{
    return redondearDecimales(total,2);
  }
  
}
