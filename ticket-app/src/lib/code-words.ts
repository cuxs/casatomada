export const ANIMALS = [
  "lombriz",
  "marmota",
  "capibara",
  "coneja",
  "garrapata",
  "gallina",
  "araña",
  "cabra",
  "perra",
  "gata",
];

export const COLORS = [
  "roja",
  "azul",
  "verde",
  "amarilla",
  "plateada",
  "dorada",
  "gris",
  "blanca",
  "negra",
  "turquesa",
];

export const PLACES = [
  "del monte",
  "de la esquina",
  "de la terraza",
  "del patio",
  "de la acequia",
  "del pantano",
  "de la selva",
  "del baño",
  "de la luna",
  "del sol",
  "de donde topa",
];

export const TOTAL_CODE_WORDS = ANIMALS.length * COLORS.length * PLACES.length;

// Cycles animal, color and place like the seconds, minutes and hours of a
// clock, so each index from 0 to TOTAL_CODE_WORDS - 1 yields a unique combo.
export function codeWordForIndex(index: number): string {
  const i = ((index % TOTAL_CODE_WORDS) + TOTAL_CODE_WORDS) % TOTAL_CODE_WORDS;
  const animal = ANIMALS[i % ANIMALS.length];
  const color = COLORS[Math.floor(i / ANIMALS.length) % COLORS.length];
  const place =
    PLACES[Math.floor(i / (ANIMALS.length * COLORS.length)) % PLACES.length];
  return `${animal} ${color} ${place}`;
}
