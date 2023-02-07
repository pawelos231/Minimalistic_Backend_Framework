export const flatten2DArray = (tab: Array<Function[]>): Function[] => {
    if (typeof tab[0] == "undefined") return []
    
    return tab.reduce((acc, curr: Function[]) => acc.concat(curr)).filter(item => typeof item === "function")
}