export const CheckIfExistsInType = <T extends Array<string>, K>(maybeCorrectType: K, valuesArray: T): K | false =>{

    const itemInArray: K = valuesArray.find(item => item == maybeCorrectType) as K
    if(itemInArray){
        return itemInArray
    }
    else{
        return false
    }
}