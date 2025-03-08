export default function FechaEmitidad() {
  const today = new Date();
  const formattedDateYear = `${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}`;
  return formattedDateYear;
}
