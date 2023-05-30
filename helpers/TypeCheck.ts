export const CheckIfExistsInType = <K, T extends readonly any[]>(maybeCorrectType: K, valuesArray: T): boolean =>{

    const itemInArray: K = valuesArray.find(item => item == maybeCorrectType)

    if(itemInArray) return true  

    else return false
    
}