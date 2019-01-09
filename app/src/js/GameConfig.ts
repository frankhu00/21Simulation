const defaultConfig: GameConfiguration = {
    penetration: 0.65,
    penetrationOffset: 0.03, //means penetration +/- penetrationOffset
    // playerCount: 1, //this refers to mc players
    // playerHand: 1,
    maxHands: 6, //max hands a player can play
    tableMaxHands: 6
    // otherPlayers: 0, //count as 1 hand per other player (so 5 means 5 other ppl on the table)
    // playerPosition: 0 // index value with respect to array with length tableMaxHands, 0 = far right end of the table (1st hand to be dealt)
}

export interface GameConfiguration {
    penetration: number,
    penetrationOffset: number,
    // playerCount: number, //*N1
    // playerHand: number, //*N1
    maxHands: number,
    tableMaxHands: number
    // otherPlayers: number, //*N1
    // playerPosition: number //*N1
}

// *N1: Just use as game setup setting, GameController doesn't need this since it registers players via register() method
//      and can register any number (type) of players (except dealer) given table size constrain is met

export default defaultConfig