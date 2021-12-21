const decimals = 4
const largeNum = 1000000000000000000

export const displayNumber = (number) => {
    return (number / largeNum).toFixed(decimals)
}
