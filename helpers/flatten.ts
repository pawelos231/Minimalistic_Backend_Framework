export const flatten2DArray = <T>(tab: Array<T[]>) => {
    if (typeof tab[0] == "undefined") return []
    return tab.reduce((acc, curr) => acc.concat(curr))
}