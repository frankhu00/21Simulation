import defaultRules, { PlayRuleOption } from './PlayRule'
import defaultConfig, { GameConfiguration } from './GameConfig'
import Card from './Card'
import Hand, { PlayingHand } from './Hand'
import Player from './Player'

import Notifier from './Notifier'

export interface GameControl {
    readonly rule: PlayRuleOption
    readonly config: GameConfiguration
    next: () => void
}

class GameController implements GameControl {

    readonly rule: PlayRuleOption = defaultRules
    readonly config: GameConfiguration = defaultConfig
    private aiHands: PlayingHand[] = [] //this is variable during a shoe (for other players)
    private playerHands: PlayingHand[] = [] //this is variable during a shoe (for main player)
    private shoeInProgress: boolean = false
    private table: Player[] = []

    constructor(rule: PlayRuleOption = defaultRules, config: GameConfiguration = defaultConfig) {
        this.rule = rule
        this.config = config
    }

    init: () => boolean = () => {
        let { otherPlayers, startingPlayerHand, maxHands, tableMaxHands } = this.config
        this.shoeInProgress = false
        if (startingPlayerHand > maxHands) {
            Notifier.error(`A player can only play up to ${maxHands} hands.`)
            return false
        }
        if (startingPlayerHand + otherPlayers > tableMaxHands) {
            Notifier.error(`The table can only hold up to ${tableMaxHands} hands.`)
            return false
        }

        for (let ai = 0; ai < otherPlayers; ai++) {
            this.aiHands.push(new Hand())
        }
        for (let p = 0; p < startingPlayerHand; p++) {
            this.playerHands.push(new Hand())
        }

        this.assignPlayerPosition()

        return true
    }

    assignPlayerPosition: () => this = () => {
        let { playerPosition } = this.config
        if (playerPosition) {
            Notifier.notify('Need to assign player position')
        }

        return this
    }

    next() {
        Notifier.notify('Delegation method called')
    }

    startShoe: () => void = () => {
        this.shoeInProgress = true
    }

    updateAIHands: (change: number) => this = (change: number) => {
        return this.updateHands(change, this.aiHands)
    }

    updatePlayerHands: (change: number) => this = (change: number) => {
        return this.updateHands(change, this.aiHands)
    }

    updateHands: (change: number, hands: PlayingHand[]) => this = (change: number, hands: PlayingHand[]) => {
        //do tha change
        return this
    }

}

export default GameController