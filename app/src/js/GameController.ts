import defaultRules, { PlayRuleOption } from './PlayRule'
import defaultConfig, { GameConfiguration } from './GameConfig'
import { PlayerInterface, PlayerType } from './Player'

import Notifier from './Notifier'

export interface GameFlowInterface {
    order: number,
    position: number,
    player?: PlayerInterface
}

export interface GameControlDelegator {
    gid: string
    next: () => void
    register: (player: PlayerInterface) => boolean
    unregister: (player: PlayerInterface) => boolean
}
export interface GameControl {
    readonly rule: PlayRuleOption
    readonly config: GameConfiguration
    flowOrder: GameFlowInterface[]
    totalPlayers: number
    totalHands: number
    players: PlayerInterface[]
    init: (players?: PlayerInterface[]) => boolean 
    getOpenHands: () => number
    getTotalHandsFromAllPlayers: (players: PlayerInterface[]) => number
    addPlayer: (player: PlayerInterface) => void
    removePlayer: (player: PlayerInterface) => void
    updateTableStatics: (players: PlayerInterface[]) => boolean
    assignPosition: (players: PlayerInterface[]) => GameControl
}

class GameController implements GameControl, GameControlDelegator {
    
    public gid: string
    readonly rule: PlayRuleOption = defaultRules
    readonly config: GameConfiguration = defaultConfig
    public flowOrder: GameFlowInterface[]
    public totalPlayers: number = 0
    public totalHands: number = 0 //because a table spot is taken by a hand and not neccessarily a player
    public players: PlayerInterface[] = []
    private shoeInProgress: boolean = false

    constructor(id: string = 'GameController', rule: PlayRuleOption = defaultRules, config: GameConfiguration = defaultConfig) {
        this.gid = id
        this.rule = rule
        this.config = config

        this.flowOrder = [...Array(this.config.tableMaxHands)].map((_, i) => {
            const gameFlow : GameFlowInterface = {
                order: i,
                position: i,
                player: undefined
            }
            return gameFlow
        })
    }

    init: (players?: PlayerInterface[]) => boolean = (players?: PlayerInterface[]) => {
        this.shoeInProgress = false
        this.totalHands = 0
        this.totalPlayers = 0
        if (players) {
            return this.updateTableStatics(players)
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
            player.changeHandTo(1).setDelegator(this)
            this.addPlayer(player)
            return this.updateTableStatics(this.players)
        }
        
        return false
    }

    //Delegation methods
    unregister(player: PlayerInterface) {
        return false
    }

    updateTableStatics = (players: PlayerInterface[]) => {
        let { tableMaxHands } = this.config
        let initNumHands = this.getTotalHandsFromAllPlayers(players)
        if (initNumHands > tableMaxHands) {
            Notifier.error(`The total number of hands (${initNumHands}) can not be greater than ${tableMaxHands}!`)
            return false
        }

        if (!this.checkAllPlayerHands(players)) {
            return false
        }

        this.players = players
        this.totalHands = initNumHands
        this.totalPlayers = players.length

        this.assignPosition(players)
        return true
    }

    getTotalHandsFromAllPlayers(players: PlayerInterface[]) {
        let totalHands = 0
        players.forEach( p => totalHands += p.numOfHands() )
        return totalHands
    }

    getOpenHands = () => {
        return this.config.tableMaxHands - this.getTotalHandsFromAllPlayers(this.players)
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