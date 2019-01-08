import Hand, { PlayingHand } from './Hand'

export interface PlayerInterface {
    numHands: number
    completeCurrentHand: () => void
    changeBet: (forHand: number, bet?: number) => void
    changeHand: (change: number) => void

}

export default class Player {

}

//Need to think about structure...

//Player should control the hands and trigger the fns of Hand class to update the hand
//Player should know about the rules/config (can hit, can split, add more hands, etc) and not the hand class itself or GameController

//GameController should just maintain the number of Player, shoe progression, setup the rules/config, and flow of game play

//So GameController controls the Player and Player controls Hand
//GameController does not control Hand