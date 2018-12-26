const defaultRules: PlayRuleOption = {
    hitSoft17: true,
    doubleDownOn: true, //on any pair
    splitOn: true, //on any pair (except Aces)
    maxSplitNum: 0, //unlimited
    splitAces: true,
    maxSplitAceNum: 2,
    minBet: 50,
    maxBet: 5000,
    betSizeToNumHands: 50, //1 hand = 1*50, 2 hands = 2*50, 3 hands = 3*50
    acePayout: 1.5,
    surrender: false,
    penetration: 0.65,
    penetrationOffset: 0.03, //means penetration +/- penetrationOffset
    maxHands: 6,
    tableMaxHands: 6,
    otherPlayers: 0
}

export interface PlayRuleOption {
    hitSoft17: boolean,
    doubleDownOn: boolean | any[], 
    splitOn: boolean | any[],
    maxSplitNum: number,
    splitAces: boolean,
    maxSplitAceNum: number,
    minBet: number,
    maxBet: number,
    betSizeToNumHands: number,
    acePayout: number,
    surrender: boolean,
    penetration: number,
    penetrationOffset: number,
    maxHands: number,
    tableMaxHands: number,
    otherPlayers: number
}

export default defaultRules