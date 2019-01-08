const defaultRules: PlayRuleOption = {
    mse: false,
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
    surrender: false
}

export interface PlayRuleOption {
    mse: boolean,
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
    surrender: boolean
}

export default defaultRules