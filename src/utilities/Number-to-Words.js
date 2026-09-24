import numberToWords from "n2words";

export default function NumberToWords(num) {
  const amount = Number(num) || 0;
  const fixed = Math.abs(amount).toFixed(2);
  const [intPartStr, cents] = fixed.split(".");
  const intPart = parseInt(intPartStr, 10);

  let words = numberToWords(intPart, { lang: "es" });
  words = words.toUpperCase();

  return `${words} CON ${cents}/100 Lps.`;
}
