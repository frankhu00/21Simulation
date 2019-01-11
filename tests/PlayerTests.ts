import 'mocha';
import { expect } from 'chai'
import sinon from 'sinon'

import Player , { PlayerType } from '../app/src/js/Player';
import GameController from '../app/src/js/GameController'

describe('Player Class Tests', () => {

    let GC: GameController
    beforeEach( () => {
        GC = new GameController()
    })
    
    it('Can delegate next fn to GameControlDelegator', () => {
        let mcPlayer = new Player(PlayerType.MC, GC)
        let aiPlayer = new Player(PlayerType.NPC, GC)
        let dealer = new Player(PlayerType.Dealer, GC)

        let gcSpy = sinon.spy(GC, 'next')

        mcPlayer.next()
        aiPlayer.next()
        dealer.next()

        expect(gcSpy.callCount).to.equal(3)
    })

    it('Can use changeHandTo to properly set number of hands', () => {
        let p = new Player(PlayerType.MC)
        
        p.join(GC) 
        let whenJoin = p.numOfHands()
        let updateA = p.changeHandTo(4).numOfHands()
        let updateB = p.changeHandTo(6).numOfHands()
        let updateC = p.changeHandTo(3).numOfHands()

        expect(whenJoin).to.eqls(1)
        expect(updateA).to.eqls(4)
        expect(updateB).to.eqls(6)
        expect(updateC).to.eqls(3)
    })

    it('Can use changeHandBy to call changeHandTo with proper arguments', () => {
        let p = new Player(PlayerType.MC)
        let changeBySpy = sinon.spy(p, 'changeHandTo')
        
        p.join(GC) //1st call
        p.changeHandBy(2) //2nd call
            .changeHandBy(1) //3rd call
            .changeHandBy(-2) //4th call
        
        expect(changeBySpy.getCall(0).calledWithExactly(1)).to.eqls(true)
        expect(changeBySpy.getCall(1).calledWithExactly(3)).to.eqls(true)
        expect(changeBySpy.getCall(2).calledWithExactly(4)).to.eqls(true)
        expect(changeBySpy.getCall(3).calledWithExactly(2)).to.eqls(true)

        expect(changeBySpy.callCount).to.eqls(4)
    })

});