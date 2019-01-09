import 'mocha';
import { expect } from 'chai'
import sinon from 'sinon'

import Player , { PlayerType } from '../app/src/js/Player';
import GameController from '../app/src/js/GameController'

describe('Player Class Tests', () => {

    const GC = new GameController()

    it('Player class delegating next fn', () => {
        let mcPlayer = new Player(PlayerType.MC, GC)
        let aiPlayer = new Player(PlayerType.NPC, GC)
        let dealer = new Player(PlayerType.Dealer, GC)

        let gcSpy = sinon.spy(GC, 'next')

        mcPlayer.next()
        aiPlayer.next()
        dealer.next()

        expect(gcSpy.callCount).to.equal(3)
    })

});