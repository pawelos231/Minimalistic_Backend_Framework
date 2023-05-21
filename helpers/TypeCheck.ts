export const CheckIfExistsInType = <K, T extends Array<any>>(maybeCorrectType: K, valuesArray: T): K | false =>{

    const itemInArray: K = valuesArray.find(item => item == maybeCorrectType)

    if(itemInArray) return itemInArray  

    else return false
    
}