import Hand, { PlayingHand } from './Hand'
import { GameControlDelegator } from './GameController'

import Notifier from './Notifier'

export enum PlayerType {
    MC,
    NPC,
    Dealer
}
export interface PlayerInterface {
    active: boolean
    numHands: number
    hands: PlayingHand[]
    currentHand: PlayingHand
    
    canHit: () => boolean
    canSplit: () => boolean
    canDoubleDown: () => boolean

    completeCurrentHand: () => void
    next: () => void
    changeBetBy: (chane: number) => PlayerInterface
    changeBetTo: (setTo: number) => PlayerInterface
    changeHandBy: (change: number) => PlayerInterface
    changeHandTo: (setTo: number) => PlayerInterface
    addHand: (change: number) => PlayerInterface
    removeHand: (change: number) => PlayerInterface
    numOfHands: () => number
    join: (game: GameControlDelegator) => boolean
    leave: () => boolean
    getType: () => PlayerType
    getGameID: () => string
    setDelegator: (delegator: GameControlDelegator) => PlayerInterface
    //Need change position
}

//Should use this as base and extend into Dealer class and Player/NPC class
//Dealer can't join, always one hand, and the AI is set in stone via game rules
//Whereas NPC/Player class can always follow a custom rule set later on...
export default class Player implements PlayerInterface {
    public active: boolean
    public numHands: number
    public currentHand: PlayingHand
    public hands: PlayingHand[]
    private type: PlayerType
    private delegator?: GameControlDelegator

    constructor(type: PlayerType = PlayerType.NPC, delegator?: GameControlDelegator, hands?: PlayingHand[]) {
        this.type = type
        if (hands) {
            this.hands = hands
            this.active = true
        }
        else {
            this.hands = [new Hand(undefined, type)]
            this.active = false
        }
        this.currentHand = this.hands[0]
        this.numHands = this.hands.length

        if (delegator) {
            this.delegator = delegator
            this.delegator.register(this)
        }
    }

    next: () => void = () => {
        if (this.delegator) {
            this.delegator.next()
        }
        else {
            Notifier.notify('Player has not joined any game!')
        }
    }

    join = (game: GameControlDelegator) => {
        if (this.delegator) {
            Notifier.notify(`Player (${PlayerType[this.getType()]}) is already in a game!`)
            return false
        }

        if (game.register(this)) {
            Notifier.notify(`Player (${PlayerType[this.getType()]}) Joined Successfully!`)
            this.delegator = game
            return true
        }
        else {
            Notifier.notify(`Player (${PlayerType[this.getType()]}) Cannot Join Game!`)
            return false
        }
    }

    //This is triggered when GameController runs register(Player) direct without going through Player class
    setDelegator = (delegator: GameControlDelegator) => {
        this.delegator = delegator
        return this
    }

    leave = () => {
        if (this.delegator) {
            if (this.delegator.unregister(this)) {
                Notifier.notify(`Player (${PlayerType[this.getType()]}) Left Successfully!`)
                this.delegator = undefined
                return true
            }
            else {
                Notifier.notify(`Player (${PlayerType[this.getType()]}) Cannot leave Game!`)
                return false
            }
        }
        else {
            Notifier.notify(`Player (${PlayerType[this.getType()]}) is not in a game!`)
            return false
        }
    } 
    
    canHit: () => boolean = () => {
        return false
    }

    canSplit: () => boolean = () => {
        return false
    }

    canDoubleDown: () => boolean = () => {
        return false
    }
    
    completeCurrentHand: () => void = () => {

    }

    betToMin = () => {
        const min = this.delegator ? this.delegator.getMinBet() : 0
        return this.changeBetTo(min)
    }

    betToMax = () => {
        const max = this.delegator ? this.delegator.getMaxBet() : 0
        return this.changeBetTo(max)
    }

    changeBetBy = (change: number) => {
        return this.changeBetTo(this.getCurrentHand().getBet() + change)
    }

    changeBetTo = (setTo: number) => {
        
        if (!this.delegator) {
            Notifier.notify('Player is not in a game, can not change bet')
            return this
        }

        const min = this.delegator.getMinBet()
        const max = this.delegator.getMaxBet()

        if (setTo < min) {
            Notifier.notify(`The minimum bet is ${min}! Auto bet to ${min}.`)
            setTo = min
        }

        if (setTo > max) {
            Notifier.notify(`The maximum bet is ${max}! Auto bet to ${max}.`)
            setTo = max
        }

        this.getCurrentHand().setBet(setTo)
        return this
    }

    changeHandBy = (change: number) => {
        return this.changeHandTo(this.hands.length + change)
    }

    changeHandTo = (setTo: number) => {
        if (!this.delegator) {
            Notifier.notify('Player is not in a game, can not change number of hands')
            return this
        }

        //For adding hands case
        if (setTo > this.numOfHands()) {
            if (this.delegator.getOpenHands() >= (setTo - this.numOfHands())) {
                this.hands = Array(setTo).fill(new Hand())
            }
            else {
                Notifier.notify(`Can not set hands to ${setTo} due to max table size. The table has ${this.delegator.getOpenHands()} spot(s) left.`)
            }
        }
        //For lowering hands case
        else {
            if (setTo > 0) {
                this.hands = Array(setTo).fill(new Hand())
            }
            else {
                Notifier.notify('Can not set hands to lower than 1')
            }
        }

        return this
    }

    addHand: (change: number) => PlayerInterface = () => {
        return this
    }

    removeHand: (change: number) => PlayerInterface = () => {
        return this
    }

    numOfHands = () => {
        return this.hands.length
    }

    getType: () => PlayerType = () => {
        return this.type
    }

    getGameID = () => {
        if (this.delegator) {
            return this.delegator.gid
        }
        else {
            return 'No game id found'
        }
    }

    getCurrentHand = () => {
        return this.currentHand
    }

}

//Need to think about structure...

//Player should control the hands and trigger the fns of Hand class to update the hand
//Player should know about the rules/config (can hit, can split, add more hands, etc), GameController / Hand doesn't know those

//GameController should just maintain the number of Player, Player order, shoe progression, setup the rules/config, and flow of game play

//So GameController controls the Player and Player controls Hand
//GameController does not control Hand
//Hand has the bet amount ? or Player?