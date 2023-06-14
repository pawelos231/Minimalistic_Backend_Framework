export const flatten2DArray = <T extends Function>(tab: Array<T[]>): T[] => {
  if (typeof tab[0] == "undefined") return [];

  return tab
    .reduce((acc, curr: T[]) => acc.concat(curr))
    .filter((item) => typeof item === "function");
};
