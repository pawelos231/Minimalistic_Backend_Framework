export const parseUrl = (url: string): string => {
    let result: string = ""
    for (let i = 0; i < url.length; i++) {
        const char: string = url.charAt(i)
        if (char === ":") {
            let param: string = ""
            let temp: number = 0
            for (let j = i + 1; j < url.length; j++) {
                temp = j
                if (/\w/.test(url.charAt(j))) {
                    param += url.charAt(j);
                } else {
                    break;
                }
            }
            temp !== url.length - 1 ? i = temp - 1 : i = temp
            result += `(?<${param}>\\w+)`
        }
        else {
            result += char;
        }
    }
    return result
}
