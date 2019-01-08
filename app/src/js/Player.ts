import Hand, { PlayingHand } from './Hand'
import GameController, { GameControl } from './GameController'

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
    changeBet: (forHand: number, bet?: number) => void
    changeHand: (change: number) => void
    addHand: (change: number) => PlayerInterface
    removeHand: (change: number) => PlayerInterface
}

export default class Player implements PlayerInterface{
    public active: boolean
    public numHands: number
    public currentHand: PlayingHand
    public hands: PlayingHand[]
    private type: PlayerType
    private delegator?: GameControl

    constructor(type: PlayerType = PlayerType.NPC, hands?: PlayingHand[], delegator?: GameControl) {
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
        this.delegator = delegator
    }

    next: () => void = () => {
        if (this.delegator) {
            this.delegator.next()
        }
        else {
            Notifier.warn('No delegator set')
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

    changeBet: (forHand: number, bet?: number) => void = () => {

    }

    changeHand: (change: number) => void = () => {

    }

    addHand: (change: number) => PlayerInterface = () => {
        return this
    }

    removeHand: (change: number) => PlayerInterface = () => {
        return this
    }


}

//Need to think about structure...

//Player should control the hands and trigger the fns of Hand class to update the hand
//Player should know about the rules/config (can hit, can split, add more hands, etc), GameController / Hand doesn't know those

//GameController should just maintain the number of Player, Player order, shoe progression, setup the rules/config, and flow of game play

//So GameController controls the Player and Player controls Hand
//GameController does not control Hand