import 'mocha';
import { expect } from 'chai'
import sinon from 'sinon'

import Player , { PlayerType } from '../app/src/js/Player'
import GameController from '../app/src/js/GameController'
import { CardCollectionInterface, Deck } from '../app/src/js/CardCollection';
import PlayRule from '../app/src/js/PlayRule'

describe('Player Class Tests', () => {

    let GC: GameController
    let dummyDeck: CardCollectionInterface = new Deck()
    beforeEach( () => {
        GC = new GameController(dummyDeck)
    })
    
    it('Can delegate next fn to GameControlDelegator', () => {
        let mcPlayer = new Player(PlayerType.MC, GC, undefined, 10000)
        let aiPlayer = new Player(PlayerType.NPC, GC, undefined, 10000)
        let dealer = new Player(PlayerType.Dealer, GC)

        let gcSpy = sinon.spy(GC, 'next')

        mcPlayer.next()
        aiPlayer.next()
        dealer.next()

        expect(gcSpy.callCount).to.equal(3)
    })

    it('Can use changeHandTo to properly set number of hands', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000)
        
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
        let p = new Player(PlayerType.MC).setBankroll(10000)
        
        p.join(GC)
        p.changeHandTo(3) //ok
            .changeHandTo(9) //should fail
            .changeHandTo(-2) //should fail

        expect(p.numOfHands()).to.eqls(3)
    })

    it('Can use changeHandBy to call changeHandTo with proper arguments', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000)
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

    it('Can force min per hand rule on multiple hands (checks sum of hands)', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000)
        const betSizeToNumHands = 40;
        const minBet = 25;
        let dummyGC = new GameController(dummyDeck, 'Dummy GC', Object.assign({}, PlayRule, { minBet, betSizeToNumHands}))
        p.join(dummyGC)
        
        let oneHand = p.getTotalBetFromAllHands()
        let fourHands = p.changeHandTo(4).getTotalBetFromAllHands()
        let twoHands = p.changeHandTo(2).getTotalBetFromAllHands()
        let invalidHands = p.changeHandTo(99).getTotalBetFromAllHands() 
        
        expect(oneHand).to.eqls(25)
        expect(twoHands).to.eqls( (betSizeToNumHands*2) *2) // (betSizeToNumHands*2) = bet amount of one hand
        expect(fourHands).to.eqls( (betSizeToNumHands*4) *4) // (betSizeToNumHands*4) = bet amount of one hand
        expect(invalidHands).to.eqls(twoHands) //same as twoHands since changeHandTo failed
    })

    it('Can compute proper bankroll after changing number of hands', () => {
        const br = 10000
        let p = new Player(PlayerType.MC).setBankroll(10000)
        const betSizeToNumHands = 62;
        const minBet = 35;
        let dummyGC = new GameController(dummyDeck, 'Dummy GC', Object.assign({}, PlayRule, { minBet, betSizeToNumHands}))
        const initBR = p.getBankroll()
        p.join(dummyGC)
        let oneHandBR = p.getBankroll()
        let fiveHandBR = p.changeHandTo(5).getBankroll()
        let threeHandBR = p.changeHandTo(3).getBankroll()

        expect(initBR).to.eqls(br)
        expect(oneHandBR).to.eqls( br - minBet)
        expect(fiveHandBR).to.eqls( br - (betSizeToNumHands*5)*5)
        expect(threeHandBR).to.eqls(br - (betSizeToNumHands*3)*3)
    })


    it('Can use changeBetTo to properly change bet amount', () => {
        let p = new Player(PlayerType.MC).setBankroll(1000)
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
        let p = new Player(PlayerType.MC).setBankroll(10000)
        
        p.join(GC)
        p.changeBetTo(2500).changeBetTo(10000) //should fail
            .changeBetTo(25) //should fail

        expect(p.getCurrentHand().getBet()).to.eqls(2500)
    })

    it('Can use changeBetBy to call changeBetTo with proper arguments', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000)
        const minBet = GC.rule.minBet
        let changeBySpy = sinon.spy(p, 'changeBetTo')
        
        p.join(GC) //join no longer calls changeBetTo, it calls changeHandTo(1) which forces the minBet
        p.changeBetBy(25) //1st call
            .changeBetBy(120) //2nd call
            .changeBetBy(-75) //3rd call
        
        expect(changeBySpy.getCall(0).calledWithExactly(minBet+25)).to.eqls(true)
        expect(changeBySpy.getCall(1).calledWithExactly(minBet+25+120)).to.eqls(true)
        expect(changeBySpy.getCall(2).calledWithExactly(minBet+25+120-75)).to.eqls(true)

        expect(changeBySpy.callCount).to.eqls(3)
    })

});