import 'mocha';
import { expect } from 'chai'
import sinon from 'sinon'

import Player , { PlayerType } from '../app/src/js/Player'
import GameController from '../app/src/js/GameController'
import { CardCollectionInterface, Deck } from '../app/src/js/CardCollection';

describe('Player Class Tests', () => {

    let GC: GameController
    let dummyDeck: CardCollectionInterface = new Deck()
    beforeEach( () => {
        GC = new GameController(dummyDeck)
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

    it('Can validate min / max number of hands', () => {
        let p = new Player(PlayerType.MC)
        
        p.join(GC)
        p.changeHandTo(3) //ok
            .changeHandTo(9) //should fail
            .changeHandTo(-2) //should fail

        expect(p.numOfHands()).to.eqls(3)
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


    it('Can use changeBetTo to properly change bet amount', () => {
        let p = new Player(PlayerType.MC)
        let minBet = GC.rule.minBet
        
        p.join(GC) 
        let whenJoin = p.getCurrentHand().getBet()
        let updateA = p.changeBetTo(100).getCurrentHand().getBet()
        let updateB = p.changeBetTo(150).getCurrentHand().getBet()
        let updateC = p.changeBetTo(75).getCurrentHand().getBet()

        expect(whenJoin).to.eqls(minBet)
        expect(updateA).to.eqls(100)
        expect(updateB).to.eqls(150)
        expect(updateC).to.eqls(75)
    })

    it('Can validate min / max bet amount', () => {
        let p = new Player(PlayerType.MC)
        
        p.join(GC)
        p.changeBetTo(2500) //ok
            .changeHandTo(10000) //should fail
            .changeHandTo(25) //should fail

        expect(p.getCurrentHand().getBet()).to.eqls(2500)
    })

    it('Can use changeBetBy to call changeBetTo with proper arguments', () => {
        let p = new Player(PlayerType.MC)
        const minBet = GC.rule.minBet
        let changeBySpy = sinon.spy(p, 'changeBetTo')
        
        p.join(GC) //1st call
        p.changeBetBy(25) //2nd call
            .changeBetBy(120) //3rd call
            .changeBetBy(-75) //4th call
        
        expect(changeBySpy.getCall(0).calledWithExactly(minBet)).to.eqls(true)
        expect(changeBySpy.getCall(1).calledWithExactly(minBet+25)).to.eqls(true)
        expect(changeBySpy.getCall(2).calledWithExactly(minBet+25+120)).to.eqls(true)
        expect(changeBySpy.getCall(3).calledWithExactly(minBet+25+120-75)).to.eqls(true)

        expect(changeBySpy.callCount).to.eqls(4)
    })

});