export const randomizeBetween = (min: number, max: number) => Math.floor( Math.random()*(1 + max-min) + min)

export const uniqueFilter = (list: any[], valueTransformFn?: (value: any) => any) => {
    if (valueTransformFn) {
        let uniqueIndexes: number[] = []
        let uniqueFilteredList: any[] = []
        list.map( elem => valueTransformFn(elem)).forEach( (val, index, self) => {
            if (self.indexOf(val) == index)  {
                uniqueIndexes.push(index)
            }
        })

        uniqueIndexes.forEach( (key, index) => {
            uniqueFilteredList[index] = list[key]
        })

        return uniqueFilteredList
    } else {
        return Array.from(new Set(list))
    }
}