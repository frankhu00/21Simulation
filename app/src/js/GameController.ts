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

export interface GameControl {
    // readonly rule: PlayRuleOption
    // readonly config: GameConfiguration
    delegator: GameControlDelegator
    flowOrder: GameFlowInterface[]
    players: PlayerInterface[]
    gid: string
    init: (players?: PlayerInterface[]) => boolean 
    getTotalHands: (players: PlayerInterface[]) => number
    getTotalPlayers: () => number
    addPlayer: (player: PlayerInterface) => void
    removePlayer: (player: PlayerInterface) => void
    updateTableStatistics: (players: PlayerInterface[]) => boolean
    assignPosition: (players: PlayerInterface[]) => GameControl
    getShoe: () => CardCollectionInterface
    getRules: () => PlayRuleOption
    getConfig: () => GameConfiguration
    getPlayers: () => PlayerInterface[]
    getDealer: () => PlayerInterface
}

class GameController implements GameControl {
    
    public gid: string
    public delegator: GameControlDelegator = new GameDelegator(this)
    readonly rule: PlayRuleOption = defaultRules
    readonly config: GameConfiguration = defaultConfig
    readonly dealer: PlayerInterface = new Player(PlayerType.Dealer)
    readonly shoe: CardCollectionInterface
    public flowOrder: GameFlowInterface[]

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

    //Deals the starting hands to each player
    dealRound() {
        // this.get
        return this
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

    getPlayers() {
        return this.players
    }

    getTotalPlayers() {
        return this.players.length
    }

    getTotalHands(players: PlayerInterface[] = this.players) {
        let totalHands = 0
        players.forEach( p => totalHands += p.numOfHands() )
        return totalHands
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

    getShoe = () => {
        return this.shoe
    }

    getRules = () => {
        return this.rule
    }

    getConfig = () => {
        return this.config
    }

    getDealer = () => {
        return this.dealer
    }

}


export interface GameControlDelegator {
    next: (player: PlayerInterface) => any
    register: (player: PlayerInterface, pos?: number) => boolean
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
    getMinBetForNumHands: (numHands: number) => number
    getGameID: () => string
}

//Separated delegation methods from controller
class GameDelegator implements GameControlDelegator {

    private controller: GameControl
    constructor(controller: GameControl) {
        this.controller = controller
    }

    getGameID() {
        return this.controller.gid
    }

    deal() {
        const dealtCard = this.controller.getShoe().deal()
        if (!dealtCard) {
            Notifier.error('GameController can\'t deal card. Shoe is empty')
        }
        return dealtCard
    }

    next(player: PlayerInterface) {
        //Signals from Player class to tell the GameController to move onto either:
        // 1) next hand of the same Player
        // 2) next Player
        // 3) End round and begin calculating phase
        // 4) Finish calculated results (payout or collect wins)
        // 5) Wait for betSize / numHand changes from all players
        // 6) Start a new round
        // 7) End shoe and begin shuffle
        // 8) Start shoe (put top card away and deal 1st round)

        //Player needs to have position set to use as indicator ?
        //Finish the flow control
        const currentPos = player.getPosition()
        if (player.hasNextHand()) {
            player.toNextHand().startHand()
        }
        else {

        }

        Notifier.notify('Delegation method called')
    }

    register(player: PlayerInterface, pos?: number) {
        if (player.getType() == PlayerType.Dealer) {
            return false
        }

        let openHands = this.getOpenHands()
        if (openHands > 0) {
            if (!pos) {
                player.setDelegator(this).changeHandTo(1) //changeHandTo will auto min bet
                this.controller.addPlayer(player)
                return this.controller.updateTableStatistics(this.controller.getPlayers())
            }
            else {
                //WIP
                return false
            }
            
        }
        
        return false
    }

    unregister(player: PlayerInterface) {
        return false
    }

    getMinBet = () => {
        return this.controller.getRules().minBet
    }

    getMinBetForNumHands = (numHands: number) => {
        return (numHands == 1) ? this.controller.getRules().minBet : this.controller.getRules().betSizeToNumHands*numHands
    }

    getMaxBet = () => {
        return this.controller.getRules().maxBet
    }

    getDealerShowingCard = () => this.controller.getDealer().getCurrentHand().getFirstCard()

    canSplit = (withHand: PlayingHand) => {
        const firstCard = withHand.getFirstCard()
        const secondCard = withHand.getSecondCard()
        const rule = this.controller.getRules()
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
        
        if (typeof rule.splitOn == 'boolean') {
            //This also means strictSplit is false
            return rule.splitOn
        }
        else {
            //Need to account for 
            //      1) # of splits (WIP... how to do it)
            //      2) strict splitting (QQ vs QK etc) (in QA)

            // Ace case is taken care of above
            if (rule.splitOn.includes(firstCard.getValue()[0])) {
                if (rule.strictSplit) {
                    return firstCard.getKey() == secondCard.getKey()
                }
                else {
                    return true
                }
            }

            return false
        }
    }

    canSplitAces = (withHand: PlayingHand) => {
        return false
    }

    canDoubleDown = (withHand: PlayingHand) => {
        const rule = this.controller.getRules()
        if (withHand.getTotalCards() != 2) {
            return false
        }
        if (typeof rule.doubleDownOn == 'boolean') {
            return rule.doubleDownOn
        }
        else {
            const [hard, soft] = withHand.getValue()
            return (rule.doubleDownOn.includes(hard) || rule.doubleDownOn.includes(soft))
        }
    }

    canInsurance = () => {
        const show = this.getDealerShowingCard()
        if (show) {
            return show.getKey() == 'A'
        }
        else {
            Notifier.error('Dealer has no cards.')
            return false
        }
    }

    canSurrender = () => {
        return this.controller.getRules().surrender
    }

    getOpenHands = () => {
        return this.controller.getConfig().tableMaxHands - this.controller.getTotalHands(this.controller.getPlayers())
    }

}


export { GameDelegator } 
export default GameController