const defaultConfig: GameConfiguration = {
    penetration: 0.65,
    penetrationOffset: 0.03, //means penetration +/- penetrationOffset
    startingPlayerHand: 1,
    maxHands: 6, //max hands a player can play
    tableMaxHands: 6,
    otherPlayers: 0, //count as 1 hand per other player (so 5 means 5 other ppl on the table)
    playerPosition: 0 // index value with respect to array with length tableMaxHands, 0 = far right end of the table (1st hand to be dealt)
}

export interface GameConfiguration {
    penetration: number,
    penetrationOffset: number,
    startingPlayerHand: number,
    maxHands: number,
    tableMaxHands: number,
    otherPlayers: number,
    playerPosition: number
}

export default defaultConfig