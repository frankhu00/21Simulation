import 'mocha';
import { expect } from 'chai'

import Player , { PlayerType, PlayerInterface } from '../app/src/js/Player'
import GameController, { GameFlowInterface } from '../app/src/js/GameController'
import { Shoe, CardCollectionInterface } from '../app/src/js/CardCollection'

describe('Flow Control Tests', () => {

    let GID: string
    let GC: GameController
    let dummyDeck: CardCollectionInterface = new Shoe()
    let p: PlayerInterface
    let ai: PlayerInterface
    let ai2: PlayerInterface
    let ai3: PlayerInterface

    const joinGame = (gc: GameController, ...players: PlayerInterface[]) => {
        players.forEach((p) => {
            p.join(gc.delegator)
        })
    }

    beforeEach( () => {
        GID = 'FlowControlGC'
        GC = new GameController(dummyDeck, GID)
        p = new Player(PlayerType.MC, undefined, undefined, 10000)
        ai = new Player(PlayerType.NPC, undefined, undefined, 10000)
        ai2 = new Player(PlayerType.NPC, undefined, undefined, 10000)
        ai3 = new Player(PlayerType.NPC, undefined, undefined, 10000)
    })

    it('GameController should have proper flowOrder property', () => {

        //Join order determines position if position is not specified in join call
        joinGame(GC, p, ai, ai2, ai3)

        //The flow order object should be
        const should: GameFlowInterface[] = [
            {
                player: p,
                position: 0,
                order: 0
            },
            {
                player: ai,
                position: 1,
                order: 1
            },
            {
                player: ai2,
                position: 2,
                order: 2
            },
            {
                player: ai3,
                position: 3,
                order: 3
            },
            {
                player: undefined,
                position: 4,
                order: 4
            },
            {
                player: undefined,
                position: 5,
                order: 5
            },
            {
                player: GC.getDealer(),
                position: -1,
                order: -1
            },
        ];
        const actual = GC.getFlowOrder()

        expect(actual).to.eql(should)
    })

    it('Can do a full round rotation (all one hand and no hits)', () => {
        joinGame(GC, p, ai, ai2, ai3)

        //INITIATE Game
    })

})