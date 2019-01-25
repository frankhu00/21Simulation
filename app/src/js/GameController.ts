//WIP:
// canSplit logic (not needed for mvp)

import defaultRules, { PlayRuleOption } from './PlayRule'
import defaultConfig, { GameConfiguration } from './GameConfig'
import Player, { PlayerInterface, PlayerType } from './Player'

import Notifier from './Notifier'
import { PlayingHand } from './Hand';
import Card from './Card';
import { CardCollectionInterface } from './CardCollection';

export interface GameFlowInterface {
    order: number,
    position: number,
    player?: PlayerInterface
}

export interface GameControlDelegator {
    readonly dealer: PlayerInterface
    readonly shoe: CardCollectionInterface
    gid: string
    next: () => void
    register: (player: PlayerInterface) => boolean
    unregister: (player: PlayerInterface) => boolean
    getOpenHands: () => number
    getMinBet: () => number
    getMaxBet: () => number
    getDealerShowingCard: () => Card|undefined
    canDoubleDown: (withHand: PlayingHand) => boolean
    canSplit: (withHand: PlayingHand) => boolean
    canInsurance: () => boolean
    canSurrender: () => boolean
    deal: () => Card|undefined
}
export interface GameControl {
    readonly rule: PlayRuleOption
    readonly config: GameConfiguration
    flowOrder: GameFlowInterface[]
    players: PlayerInterface[]
    init: (players?: PlayerInterface[]) => boolean 
    getTotalHands: (players: PlayerInterface[]) => number
    getTotalPlayers: () => number
    addPlayer: (player: PlayerInterface) => void
    removePlayer: (player: PlayerInterface) => void
    updateTableStatistics: (players: PlayerInterface[]) => boolean
    assignPosition: (players: PlayerInterface[]) => GameControl
}

class GameController implements GameControl, GameControlDelegator {
    
    public gid: string
    readonly rule: PlayRuleOption = defaultRules
    readonly config: GameConfiguration = defaultConfig
    readonly dealer: PlayerInterface = new Player(PlayerType.Dealer)
    readonly shoe: CardCollectionInterface
    public flowOrder: GameFlowInterface[]

    //These two can change when player class changes hands etc
    // public totalPlayers: number = 0
    // public totalHands: number = 0 //because a table spot is taken by a hand and not neccessarily a player

    public players: PlayerInterface[] = []
    private shoeInProgress: boolean = false

    constructor(shoe: CardCollectionInterface, id: string = 'GameController', rule: PlayRuleOption = defaultRules, config: GameConfiguration = defaultConfig) {
        this.gid = id
        this.rule = rule
        this.config = config
        this.shoe = shoe

        this.flowOrder = [...Array(this.config.tableMaxHands)].map((_, i) => {
            const gameFlow : GameFlowInterface = {
                order: i,
                position: i,
                player: undefined
            }
            return gameFlow
        })

        const dealerFlow : GameFlowInterface = {
            order: -1,
            position: -1,
            player: this.dealer
        }

        this.flowOrder.push(dealerFlow)
    }

    init: (players?: PlayerInterface[]) => boolean = (players?: PlayerInterface[]) => {
        this.shoeInProgress = false
        // this.totalHands = 0
        // this.totalPlayers = 0
        if (players) {
            return this.updateTableStatistics(players)
        }
        return true
    }

    assignPosition = (players: PlayerInterface[]) => {
        
        this.flowOrder.forEach( (order, ind) => {
            //Just fill the flow order in order of players for now
            if (players[ind]) {
                order.player = players[ind]
            }
        })

        return this
    }

    //Delegation methods
    deal() {
        const dealtCard = this.shoe.deal()
        if (!dealtCard) {
            Notifier.error('GameController can\'t deal card. Shoe is empty')
        }
        return dealtCard
    }

    //Delegation methods
    next() {
        //Signals from Player class to tell the GameController to move onto either:
        // 1) next hand of the same Player
        // 2) next Player
        // 3) End round and begin calculating phase
        // 4) Finish calculated results (payout or collect wins)
        // 5) Wait for betSize / numHand changes from all players
        // 6) Start a new round
        // 7) End shoe and begin shuffle
        // 8) Start shoe (put top card away and deal 1st round)
        Notifier.notify('Delegation method called')
    }

    //Delegation methods
    register(player: PlayerInterface) {
        if (player.getType() == PlayerType.Dealer) {
            return false
        }

        let openHands = this.getOpenHands()
        if (openHands > 0) {
            player.setDelegator(this).changeHandTo(1).changeBetTo(this.rule.minBet)
            this.addPlayer(player)
            return this.updateTableStatistics(this.players)
        }
        
        return false
    }

    //Delegation methods
    unregister(player: PlayerInterface) {
        return false
    }

    //Delegation
    getMinBet = () => {
        return this.rule.minBet
    }

    //Delegation
    getMaxBet = () => {
        return this.rule.maxBet
    }

    //Delegation
    getDealerShowingCard = () => this.dealer.getCurrentHand().getFirstCard()

    //Delegation
    canSplit = (withHand: PlayingHand) => {
        const firstCard = withHand.getFirstCard()
        const secondCard = withHand.getSecondCard()
        if (withHand.getTotalCards() != 2 || !firstCard || !secondCard) {
            return false
        }

        if (firstCard.getKey() != secondCard.getKey()) {
            return false
        }

        //After this point, firstCard == secondCard
        if (firstCard.getKey() == 'A') {
            return this.canSplitAces(withHand)
        }
        
        if (typeof this.rule.splitOn == 'boolean') {
            //This also means strictSplit is false
            return this.rule.splitOn
        }
        else {
            //Need to account for 
            //      1) # of splits (WIP... how to do it)
            //      2) strict splitting (QQ vs QK etc) (in QA)

            // Ace case is taken care of above
            if (this.rule.splitOn.includes(firstCard.getValue()[0])) {
                if (this.rule.strictSplit) {
                    return firstCard.getKey() == secondCard.getKey()
                }
                else {
                    return true
                }
            }

            return false
        }
    }

    //Delegator private method
    canSplitAces = (withHand: PlayingHand) => {
        return false
    }

    //Delegation
    canDoubleDown = (withHand: PlayingHand) => {
        if (withHand.getTotalCards() != 2) {
            return false
        }
        if (typeof this.rule.doubleDownOn == 'boolean') {
            return this.rule.doubleDownOn
        }
        else {
            const [hard, soft] = withHand.getValue()
            return (this.rule.doubleDownOn.includes(hard) || this.rule.doubleDownOn.includes(soft))
        }
    }

    //Delegation
    canInsurance = () => {
        const show = this.getDealerShowingCard()
        if (show) {
            return show.getKey() == 'A'
        }
        else {
            Notifier.notify('Dealer has no cards.')
            return false
        }
    }

    //Delegation
    canSurrender = () => {
        return this.rule.surrender
    }

    updateTableStatistics = (players: PlayerInterface[]) => {
        let { tableMaxHands } = this.config
        let initNumHands = this.getTotalHands(players)
        if (initNumHands > tableMaxHands) {
            Notifier.error(`The total number of hands (${initNumHands}) can not be greater than ${tableMaxHands}!`)
            return false
        }

        if (!this.checkAllPlayerHands(players)) {
            return false
        }

        this.players = players
        // this.totalHands = initNumHands
        // this.totalPlayers = players.length

        this.assignPosition(players)
        return true
    }

    getTotalPlayers() {
        return this.players.length
    }

    getTotalHands(players: PlayerInterface[] = this.players) {
        let totalHands = 0
        players.forEach( p => totalHands += p.numOfHands() )
        return totalHands
    }

    getOpenHands = () => {
        return this.config.tableMaxHands - this.getTotalHands(this.players)
    }

    checkHandsPerPlayer(player: PlayerInterface) {
        if (player.numOfHands() > this.config.maxHands) {
            Notifier.error(`A single player may not play more than ${this.config.maxHands} hands!`)
            return false
        }
        else {
            return true
        }
    }

    checkAllPlayerHands(players: PlayerInterface[]) {
        return players.every( p => this.checkHandsPerPlayer(p) )
    }

    startShoe: () => void = () => {
        this.shoeInProgress = true
    }

    addPlayer = (player: PlayerInterface) => {
        this.players.push(player)
    }

    removePlayer = (player: PlayerInterface) => {

    }

}

export default GameController