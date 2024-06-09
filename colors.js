export const teal = "#69f7be";
export const blue = "#69c8f7";
export const purple = "#8a69f7";
export const pink = "#f769d6";
export const yellow = "#e9f769";
export const red = "#f76969";

const colors = { teal, blue, purple, pink, yellow, red };
export default colors;

export function randomColor() {
  const colorValues = Object.values(colors);
  const randomIndex = Math.floor(Math.random() * colorValues.length);
  return colorValues[randomIndex];
}
