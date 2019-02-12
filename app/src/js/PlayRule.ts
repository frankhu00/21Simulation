const defaultRules: PlayRuleOption = {
    mse: false,
    hitSoft17: true,
    doubleDownOn: true, //on any pair
    splitOn: true, //on any pair (except Aces)
    maxSplitNum: 0, //unlimited
    strictSplit: true, //true means Q and Q can split, but NOT Q and 10, etc. Whereas false means Q and 10 can split
    splitAces: true,
    maxSplitAceNum: 2,
    minBet: 50,
    maxBet: 5000,
    betSizeToNumHands: 50, //1 hand = minBet per hand, 2 hands = 2*betSizeToNumHands per hand, 3 hands = 3*betSizeToNumHands per hand, so on
    acePayout: 1.5,
    surrender: false
}

export interface PlayRuleOption {
    mse: boolean,
    hitSoft17: boolean,
    doubleDownOn: boolean | number[], 
    splitOn: boolean | number[],
    maxSplitNum: number,
    strictSplit: boolean,
    splitAces: boolean,
    maxSplitAceNum: number,
    minBet: number,
    maxBet: number,
    betSizeToNumHands: number,
    acePayout: number,
    surrender: boolean
}

export default defaultRules