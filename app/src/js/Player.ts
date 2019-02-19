import Hand, { PlayingHand } from './Hand'
import { GameControlDelegator } from './GameController'

import Notifier from './Notifier'

export enum PlayerType {
    MC,
    NPC,
    Dealer
}

export interface PlayerActionInterface {
    name: string,
    can: boolean,
    action: () => any
}

export interface PlayerInterface {
    active: boolean
    // numHands: number
    // hands: PlayingHand[]
    // currentHand: PlayingHand

    getBankroll: () => number
    updateBankroll: (amount: number) => PlayerInterface
    setBankroll: (to: number) => PlayerInterface
    hasEnoughBankroll: (amount: number, useBankroll?: number) => boolean
    
    canHit: () => boolean
    canSplit: () => boolean
    canDoubleDown: () => boolean
    canInsurance: () => boolean

    hit: () => PlayerInterface
    doubleDown: () => PlayerInterface
    insurance: () => PlayerInterface
    surrender: () => PlayerInterface

    //this is finish current hand and move to next hand / player
    completeCurrentHand: () => void
    // next: () => void

    changeBetBy: (chane: number) => PlayerInterface
    changeBetTo: (setTo: number) => PlayerInterface
    changeHandBy: (change: number) => PlayerInterface
    changeHandTo: (setTo: number) => PlayerInterface
    addHand: (change: number) => PlayerInterface
    removeHand: (change: number) => PlayerInterface
    numOfHands: () => number
    join: (game: GameControlDelegator, pos?: number) => boolean
    leave: () => boolean
    getType: () => PlayerType
    getGameID: () => string
    getCurrentHand: () => PlayingHand
    getTotalBetFromAllHands: () => number
    setDelegator: (delegator: GameControlDelegator) => PlayerInterface
    getPosition: () => number
    setPosition: (pos: number) => PlayerInterface
    //Need change position

    startHand: () => PlayerInterface
    hasNextHand: () => boolean
    toNextHand: () => PlayerInterface
}

//Should use this as base and extend into Dealer class and Player/NPC class
//Dealer can't join, always one hand, and the AI is set in stone via game rules
//Whereas NPC/Player class can always follow a custom rule set later on...
export default class Player implements PlayerInterface {
    public active: boolean
    // private numHands: number
    private bankroll: number = 0
    private currentHandIndex: number = 0
    private hands: PlayingHand[]
    private type: PlayerType
    private delegator?: GameControlDelegator
    private position: number = -99 //this is used as an identifier for players in GameController / GameDelegator

    constructor(type: PlayerType = PlayerType.NPC, delegator?: GameControlDelegator, hands?: PlayingHand[], bankroll?: number) {
        this.type = type
        if (hands) {
            this.hands = hands
            this.active = true
        }
        else {
            this.hands = [new Hand(undefined, type)]
            this.active = false
        }
        this.currentHandIndex = 0

        if (bankroll) {
            this.setBankroll(bankroll)
        }

        if (delegator) {
            this.delegator = delegator
            this.delegator.register(this)
        }
    }

    startHand = () => {
        //Control logic
        return this
    }

    toNextHand = () => {
        this.currentHandIndex++
        return this
    }

    join = (game: GameControlDelegator, pos?: number) => {
        if (this.delegator) {
            Notifier.error(`Player (${PlayerType[this.getType()]}) is already in a game!`)
            return false
        }

        if (game.register(this, pos)) {
            Notifier.notify(`Player (${PlayerType[this.getType()]}) Joined Successfully!`)
            this.delegator = game
            return true
        }
        else {
            Notifier.notify(`Player (${PlayerType[this.getType()]}) Cannot Join Game!`)
            return false
        }
    }

    getBankroll = () => {
        return this.bankroll
    }

    updateBankroll = (amount: number) => {
        this.bankroll += amount
        return this
    }

    setBankroll = (to: number) => {
        this.bankroll = to
        return this
    }

    hasEnoughBankroll = (amount: number, useBankroll?: number) => {
        if (amount > 0) {
            return (typeof useBankroll != 'undefined') ? useBankroll >= amount : this.getBankroll() >= amount
        }
        else {
            return false
        }
    }

    //This is not in any interface atm
    //Requirements that all actions need to pass (only bankroll so far)
    //Bind this to action UI fn
    actionRequirements = (actionCheck: () => boolean) => {
        if (this.hasEnoughBankroll(this.getCurrentHand().getBet())) {
            return actionCheck()
        }
        else {
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
            Notifier.error(`Player (${PlayerType[this.getType()]}) is not in a game!`)
            return false
        }
    } 
    
    canHit: () => boolean = () => {
        return !this.getCurrentHand().isBusted
    }

    canSplit: () => boolean = () => {
        if (this.delegator && this.hasEnoughBankroll(this.getCurrentHand().getBet())) {
            return this.delegator.canSplit(this.getCurrentHand())
        }
        return false
    }

    canDoubleDown: () => boolean = () => {
        if (this.delegator && this.hasEnoughBankroll(this.getCurrentHand().getBet())) {
            return this.delegator.canDoubleDown(this.getCurrentHand())
        }
        return false
    }
    
    canInsurance: () => boolean = () => {
        if (this.delegator && this.hasEnoughBankroll( this.getCurrentHand().getBet() / 2) ) {
            return this.delegator.canInsurance()
        }
        return false
    }

    canSurrender = () => {
        //Will need to add cond to disable surrender when split
        if (this.delegator && this.getCurrentHand().getTotalCards() == 2) {
            return this.delegator.canSurrender()
        }
        return false
    }

    //This is more of an UI interface fn
    action = () => {
        const canPerform : PlayerActionInterface[] = [
            {
                name: 'Stay',
                can: true,
                action: this.completeCurrentHand
            },
            {
                name: 'Hit',
                can: this.canHit(),
                action: this.hit
            },
            {
                name: 'Double Down',
                can: this.actionRequirements.call(this, this.canDoubleDown),
                action: this.doubleDown
            },
            {
                name: 'Insurance',
                can: this.actionRequirements.call(this, this.canInsurance),
                action: this.insurance
            },
            {
                name: 'Split',
                can: this.actionRequirements.call(this, this.canSplit),
                action: this.split
            },
            {
                name: 'Surrender',
                can: this.canSurrender(),
                action: this.surrender
            }
        ]
    }

    hit = () => {
        if (this.canHit()) {
            const card = this.delegator!.deal() //bang operator should be fine...
            if (card) {
                this.getCurrentHand().hit(card)
            }
        }
        return this
    }

    doubleDown = () => {
        if (this.canDoubleDown()) {
            const card = this.delegator!.deal() //bang operator should be fine...
            if (card) {
                this.getCurrentHand().hit(card)
                this.changeBetBy(this.getCurrentHand().getBet())
                this.completeCurrentHand();
            }
        }
        return this
    }

    insurance = () => {
        if (this.canInsurance()) {
            this.getCurrentHand().isInsured = true
            //Need to set the amount...? or have a separate one? or just auto set 50% of bet amount?
        }
        return this
    }

    split = () => {
        return this
    }

    surrender = () => {
        return this
    }

    completeCurrentHand: () => void = () => {
        if (this.delegator) {
            this.delegator.next(this)
        }
        else {
            Notifier.error('Player has not joined any game!')
        }
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
            Notifier.error('Player is not in a game, can not change bet')
            return this
        }

        // + means an increase in bet amount -> check bankroll has enough for the difference
        // - means a decrease in bet amount -> always ok
        let changeInBet = setTo - this.getCurrentHand().getBet()
        if (changeInBet > 0 && !this.hasEnoughBankroll(changeInBet)) {
            Notifier.error(`Player does NOT have sufficient bankroll.`)
            return this
        }

        const min = this.delegator.getMinBet()
        const max = this.delegator.getMaxBet()

        if (setTo < min) {
        // Will need to take care of hasEnoughBankroll checks for auto betting
        //     Notifier.notify(`The minimum bet is ${min}! Auto bet to ${min}.`)
        //     setTo = min
            Notifier.error(`The minimum bet is ${min}!`)
            return this
        }

        if (setTo > max) {
        //     Notifier.notify(`The maximum bet is ${max}! Auto bet to ${max}.`)
        //     setTo = max
            Notifier.error(`The maximum bet is ${max}!`)
            return this
        }

        //Get back currentHand bet amount to bankroll first        
        this.updateBankroll(this.getCurrentHand().getBet())
        this.updateBankroll(-1*setTo) //subtract setTo bet amount
        this.getCurrentHand().setBet(setTo)
        return this
    }

    changeHandBy = (change: number) => {
        return this.changeHandTo(this.hands.length + change)
    }

    changeHandTo = (setTo: number) => {
        if (!this.delegator) {
            Notifier.error('Player is not in a game, can not change number of hands')
            return this
        }

        const minBetPerHand = this.delegator.getMinBetForNumHands(setTo)
        const totalBankrollNeeded = minBetPerHand * setTo
        const currentTotalBet = this.getTotalBetFromAllHands()

        //For adding hands case
        if (setTo > this.numOfHands()) {
            if (this.delegator.getOpenHands() >= (setTo - this.numOfHands())) {

                const extraBankrollNeeded = totalBankrollNeeded - currentTotalBet
                if (this.hasEnoughBankroll(extraBankrollNeeded)) {
                    this.updateBankroll(-1*extraBankrollNeeded)
                    this.hands = Array(setTo).fill(new Hand().setBet(minBetPerHand))
                }
                else {
                    Notifier.error(`Don't have enough bankroll to play ${setTo} hands!`)
                }
            }
            else {
                Notifier.error(`Can not set hands to ${setTo} due to max table size. The table has ${this.delegator.getOpenHands()} spot(s) left.`)
            }
        }
        //For lowering hands case
        else if (setTo < this.numOfHands()) {
            if (setTo > 0) { //wont have not enough bet issue
                const bankrollReturned = currentTotalBet - totalBankrollNeeded
                this.updateBankroll(bankrollReturned)
                this.hands = Array(setTo).fill(new Hand().setBet(minBetPerHand))
            }
            else {
                Notifier.error('Can not set hands to lower than 1')
            }
        }
        //For equal case, usually occurs when player join game
        else {
            this.updateBankroll(currentTotalBet) //add back currentTotal
            this.updateBankroll(-1*totalBankrollNeeded) //take out needed br to bet
            this.hands = Array(setTo).fill(new Hand().setBet(minBetPerHand))
        }

        return this
    }

    //This is strictly for split
    addHand: (change: number) => PlayerInterface = () => {
        return this
    }

    //This is strictly for split
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
            return this.delegator.getGameID()
        }
        else {
            return 'No game id found'
        }
    }

    getCurrentHand = () => {
        return this.hands[this.currentHandIndex]
    }

    getHands = () => {
        return this.hands
    }

    hasNextHand = () => {
        return (typeof this.getHands()[this.currentHandIndex+1] != 'undefined')
    }

    getTotalBetFromAllHands = () => {
        let sum: number = 0
        this.hands.forEach((h) => {
            sum += h.getBet(); 
        });
        return sum
    }

    getPosition = () => {
        return this.position
    }

    setPosition = (pos: number) => {
        this.position = pos
        return this

    }

}

//Need to think about structure...

//Player should control the hands and trigger the fns of Hand class to update the hand
//Player should know about the rules/config (can hit, can split, add more hands, etc), GameController / Hand doesn't know those

//GameController should just maintain the number of Player, Player order, shoe progression, setup the rules/config, and flow of game play

//So GameController controls the Player and Player controls Hand
//GameController does not control Hand
//Hand has the bet amount ? or Player?