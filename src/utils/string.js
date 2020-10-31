/**
 * @param {string} input
 * @return {string}
 */
export function toCamelCase(input) {
  const w = " ";
  const c = "";
  return input
    .split(w)
    .map((word) =>
      word
        .split(c)
        .map((char, i) => (i === 0 ? char.toUpperCase() : char))
        .join(c)
    )
    .join(w);
}