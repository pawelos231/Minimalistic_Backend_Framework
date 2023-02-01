export const flatten2DArray = <T>(tab: Array<T[]>) => {
    return tab.reduce((acc, curr) => acc.concat(curr))
}