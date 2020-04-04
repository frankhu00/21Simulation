import sinon from 'sinon';

import Player, { PlayerType } from '~model/Player';
import GameController from '~model/GameController';
import { CardCollectionInterface, Deck } from '~model/CardCollection';
import PlayRule from '~model/PlayRule';
import { randomizeBetween } from '~model/Utility';

describe('Player Class Tests', () => {
    let GC: GameController;
    let dummyDeck: CardCollectionInterface = new Deck();
    beforeEach(() => {
        GC = new GameController(dummyDeck);
    });

    describe('Player Hand Tests', () => {
        it('Can use changeHandTo to properly set number of hands', () => {
            let p = new Player(PlayerType.MC).setBankroll(10000);

            p.join(GC.delegator);
            let whenJoin = p.numOfHands();
            let updateA = p.changeHandTo(4).numOfHands();
            let updateB = p.changeHandTo(6).numOfHands();
            let updateC = p.changeHandTo(3).numOfHands();

            expect(whenJoin).toStrictEqual(1);
            expect(updateA).toStrictEqual(4);
            expect(updateB).toStrictEqual(6);
            expect(updateC).toStrictEqual(3);
        });

        it('Can validate min / max number of hands', () => {
            let p = new Player(PlayerType.MC).setBankroll(10000);

            p.join(GC.delegator);
            p.changeHandTo(3) //ok
                .changeHandTo(9) //should fail
                .changeHandTo(-2); //should fail

            expect(p.numOfHands()).toStrictEqual(3);
        });

        it('Can use changeHandBy to call changeHandTo with proper arguments', () => {
            let p = new Player(PlayerType.MC).setBankroll(10000);
            let changeBySpy = sinon.spy(p, 'changeHandTo');

            p.join(GC.delegator); //1st call
            p.changeHandBy(2) //2nd call
                .changeHandBy(1) //3rd call
                .changeHandBy(-2); //4th call

            expect(changeBySpy.getCall(0).calledWithExactly(1)).toStrictEqual(true);
            expect(changeBySpy.getCall(1).calledWithExactly(3)).toStrictEqual(true);
            expect(changeBySpy.getCall(2).calledWithExactly(4)).toStrictEqual(true);
            expect(changeBySpy.getCall(3).calledWithExactly(2)).toStrictEqual(true);

            expect(changeBySpy.callCount).toStrictEqual(4);
        });

        it('Can force min per hand rule on multiple hands (checks sum of hands)', () => {
            let p = new Player(PlayerType.MC).setBankroll(10000);
            const betSizeToNumHands = 40;
            const minBet = 25;
            let dummyGC = new GameController(
                dummyDeck,
                'Dummy GC',
                Object.assign({}, PlayRule, { minBet, betSizeToNumHands })
            );
            p.join(dummyGC.delegator);

            let oneHand = p.getTotalBetFromAllHands();
            let fourHands = p.changeHandTo(4).getTotalBetFromAllHands();
            let twoHands = p.changeHandTo(2).getTotalBetFromAllHands();
            let invalidHands = p.changeHandTo(99).getTotalBetFromAllHands();

            expect(oneHand).toStrictEqual(25);
            expect(twoHands).toStrictEqual(betSizeToNumHands * 2 * 2); // (betSizeToNumHands*2) = bet amount of one hand
            expect(fourHands).toStrictEqual(betSizeToNumHands * 4 * 4); // (betSizeToNumHands*4) = bet amount of one hand
            expect(invalidHands).toStrictEqual(twoHands); //same as twoHands since changeHandTo failed
        });

        it('Can compute proper bankroll after changing number of hands', () => {
            const br = 10000;
            let p = new Player(PlayerType.MC).setBankroll(10000);
            const betSizeToNumHands = 62;
            const minBet = 35;
            let dummyGC = new GameController(
                dummyDeck,
                'Dummy GC',
                Object.assign({}, PlayRule, { minBet, betSizeToNumHands })
            );
            const initBR = p.getBankroll();
            p.join(dummyGC.delegator);
            let oneHandBR = p.getBankroll();
            let fiveHandBR = p.changeHandTo(5).getBankroll();
            let threeHandBR = p.changeHandTo(3).getBankroll();

            expect(initBR).toStrictEqual(br);
            expect(oneHandBR).toStrictEqual(br - minBet);
            expect(fiveHandBR).toStrictEqual(br - betSizeToNumHands * 5 * 5);
            expect(threeHandBR).toStrictEqual(br - betSizeToNumHands * 3 * 3);
        });
    });

    describe('Player Bet Amount Tests', () => {
        it('Can use changeBetTo to properly change bet amount', () => {
            let p = new Player(PlayerType.MC).setBankroll(1000);
            let minBet = GC.getRules().minBet;

            p.join(GC.delegator);
            let whenJoin = p.getCurrentHand().getBet();
            let updateA = p.changeBetTo(100).getCurrentHand().getBet();
            let updateB = p.changeBetTo(150).getCurrentHand().getBet();
            let updateC = p.changeBetTo(75).getCurrentHand().getBet();

            expect(whenJoin).toStrictEqual(minBet);
            expect(updateA).toStrictEqual(100);
            expect(updateB).toStrictEqual(150);
            expect(updateC).toStrictEqual(75);
        });

        it('Can validate min / max bet amount', () => {
            let p = new Player(PlayerType.MC).setBankroll(10000);

            p.join(GC.delegator);
            p.changeBetTo(2500)
                .changeBetTo(10000) //should fail
                .changeBetTo(25); //should fail

            expect(p.getCurrentHand().getBet()).toStrictEqual(2500);
        });

        it('Can use changeBetBy to call changeBetTo with proper arguments', () => {
            let p = new Player(PlayerType.MC).setBankroll(10000);
            const minBet = GC.getRules().minBet;
            let changeBySpy = sinon.spy(p, 'changeBetTo');

            p.join(GC.delegator); //join no longer calls changeBetTo, it calls changeHandTo(1) which forces the minBet
            p.changeBetBy(25) //1st call
                .changeBetBy(120) //2nd call
                .changeBetBy(-75); //3rd call

            expect(changeBySpy.getCall(0).calledWithExactly(minBet + 25)).toStrictEqual(true);
            expect(changeBySpy.getCall(1).calledWithExactly(minBet + 25 + 120)).toStrictEqual(true);
            expect(changeBySpy.getCall(2).calledWithExactly(minBet + 25 + 120 - 75)).toStrictEqual(
                true
            );

            expect(changeBySpy.callCount).toStrictEqual(3);
        });
    });

    describe('Player Action Tests', () => {
        //These should be written after dealing fn and flow control is finished
        it('Checks hand before hit', () => {});

        it('Checks bet amount and rules before double down', () => {});

        it('Checks bet amount, rules, and hand before split', () => {});

        it('Checks bet amount, rules, and dealer hand before insurance', () => {});

        it('Can join game at specified positions', () => {
            let p = new Player(PlayerType.MC).setBankroll(10000);
            let pos = randomizeBetween(1, 5);
            p.join(GC.delegator, pos); //join at random position (exclude 0 since thats normal behavior)
            let actual = p.getPosition();

            expect(actual).toStrictEqual(pos);
        });

        it('Cannot join game at occupied positions', () => {
            let p = new Player(PlayerType.MC).setBankroll(10000);
            let ai = new Player(PlayerType.NPC).setBankroll(10000);
            let pos = 4;

            ai.join(GC.delegator, pos);
            let successful = p.join(GC.delegator, pos); //should fail

            expect(successful).toStrictEqual(false);
        });
    });
});
