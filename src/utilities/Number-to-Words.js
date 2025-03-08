import numberToWords  from 'n2words';

export default function NumberToWords(num) {
  let result = numberToWords(num, {lang: 'es'});
  result = result.toUpperCase();
  return result;
}
