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
    changeBetBy: (forHand: number, change?: number) => void
    changeBetTo: (forHand: number, bet?: number) => void
    changeHandBy: (change: number) => PlayerInterface
    changeHandTo: (setTo: number) => PlayerInterface
    addHand: (change: number) => PlayerInterface
    removeHand: (change: number) => PlayerInterface
    numOfHands: () => number
    join: (game: GameControlDelegator) => boolean
    leave: () => boolean
    getType: () => PlayerType
    getGameID: () => string
    setDelegator: (delegator: GameControlDelegator) => any
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
            Notifier.warn('Player has not joined any game!')
        }
    }

    join = (game: GameControlDelegator) => {
        if (this.delegator) {
            Notifier.error(`Player (${PlayerType[this.getType()]}) is already in a game!`)
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

    changeBetBy = (forHand: number, change?: number) => {

    }

    changeBetTo = (forHand: number, bet?: number) => {

    }

    changeHandBy = (change: number) => {
        return this.changeHandTo(this.hands.length + change)
    }

    changeHandTo = (setTo: number) => {
        this.hands = Array(setTo).fill(new Hand())
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

}

//Need to think about structure...

//Player should control the hands and trigger the fns of Hand class to update the hand
//Player should know about the rules/config (can hit, can split, add more hands, etc), GameController / Hand doesn't know those

//GameController should just maintain the number of Player, Player order, shoe progression, setup the rules/config, and flow of game play

//So GameController controls the Player and Player controls Hand
//GameController does not control Hand