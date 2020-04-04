import Player, { PlayerType } from '~model/Player';
import GameController from '~model/GameController';
import defaultConfig, { GameConfiguration } from '~model/GameConfig';
import defaultRules, { PlayRuleOption } from '~model/PlayRule';
import Hand from '~model/Hand';
import Card from '~model/Card';
import { Deck, CardCollectionInterface } from '~model/CardCollection';

describe('GameController Tests', () => {
    let GID: string;
    let GC: GameController;
    let dummyDeck: CardCollectionInterface = new Deck();

    let fourPlayerConfig: GameConfiguration;
    let maxFourGC: GameController;

    beforeEach(() => {
        GID = 'GameTestID';
        GC = new GameController(dummyDeck, GID);

        fourPlayerConfig = Object.assign({}, defaultConfig, { tableMaxHands: 4 });
        maxFourGC = new GameController(
            dummyDeck,
            'max 4 players/hands',
            defaultRules,
            fourPlayerConfig
        );
    });

    it('Can register players', () => {
        let mcPlayer = new Player(PlayerType.MC).setBankroll(10000);
        let registered = GC.delegator.register(mcPlayer);
        mcPlayer.getGameID();

        expect(registered).toStrictEqual(true);
        expect(mcPlayer.getGameID()).toStrictEqual(GID);
        expect(GC.getTotalPlayers()).toStrictEqual(1);
    });

    it('Can register multiple players', () => {
        let players = [
            new Player(PlayerType.MC).setBankroll(10000),
            new Player(PlayerType.MC).setBankroll(10000),
            new Player(PlayerType.NPC).setBankroll(10000),
            new Player(PlayerType.NPC).setBankroll(10000),
            new Player(PlayerType.NPC).setBankroll(10000),
        ];
        let resultRegistered = players.map((p) => GC.delegator.register(p));
        let shouldRegistered = Array(5).fill(true);

        let resultGID = players.map((p) => p.getGameID());
        let shouldGID = Array(5).fill(GID);

        expect(resultRegistered).toStrictEqual(shouldRegistered);
        expect(resultGID).toStrictEqual(shouldGID);
        expect(GC.getTotalPlayers()).toStrictEqual(5);
    });

    it('Can have multiple players join', () => {
        let players = [
            new Player(PlayerType.MC).setBankroll(10000),
            new Player(PlayerType.MC).setBankroll(10000),
            new Player(PlayerType.NPC).setBankroll(10000),
            new Player(PlayerType.NPC).setBankroll(10000),
            new Player(PlayerType.NPC).setBankroll(10000),
        ];
        let resultRegistered = players.map((p) => p.join(GC.delegator));
        let shouldRegistered = Array(5).fill(true);

        let resultGID = players.map((p) => p.getGameID());
        let shouldGID = Array(5).fill(GID);

        expect(resultRegistered).toStrictEqual(shouldRegistered);
        expect(resultGID).toStrictEqual(shouldGID);
    });

    it('Can properly limit player size to 4 hands (1 hand per player)', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000);
        let a1 = new Player(PlayerType.NPC).setBankroll(10000);
        let a2 = new Player(PlayerType.NPC).setBankroll(10000);
        let a3 = new Player(PlayerType.NPC).setBankroll(10000);
        let a4 = new Player(PlayerType.NPC).setBankroll(10000);

        p.join(maxFourGC.delegator);
        a1.join(maxFourGC.delegator);
        a2.join(maxFourGC.delegator);
        a3.join(maxFourGC.delegator);

        //This should fail to join
        let didFifthPlayerJoin = a4.join(maxFourGC.delegator);
        expect(didFifthPlayerJoin).toStrictEqual(false);
        expect(maxFourGC.getTotalPlayers()).toStrictEqual(4);
    });

    it('Can properly limit player size to 4 hands (1 player with 4 hands)', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000);
        let ai = new Player(PlayerType.NPC).setBankroll(10000);

        p.join(maxFourGC.delegator);
        p.changeHandTo(4); //need to execute after joining (first join forces hands to be 1)

        let didJoin = ai.join(maxFourGC.delegator);

        //This should fail to join
        expect(didJoin).toStrictEqual(false);
        expect(maxFourGC.getTotalPlayers()).toStrictEqual(1);
        expect(maxFourGC.getTotalHands()).toStrictEqual(4);
    });

    it('Can properly limit player size to 4 hands (3 hands for mc player, 1 for ai)', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000);
        let a1 = new Player(PlayerType.NPC).setBankroll(10000);
        let a2 = new Player(PlayerType.NPC).setBankroll(10000);

        p.join(maxFourGC.delegator);
        p.changeHandTo(3); //need to execute after joining (first join forces hands to be 1)
        a1.join(maxFourGC.delegator);
        a1.changeHandTo(1); //need to execute after joining (first join forces hands to be 1)

        let didJoin = a2.join(maxFourGC.delegator);

        //This should fail to join
        expect(didJoin).toStrictEqual(false);
        expect(maxFourGC.getTotalPlayers()).toStrictEqual(2);
        expect(maxFourGC.getTotalHands()).toStrictEqual(4);
    });

    it('Does force number of hands to 1 and bet amount to min bet on player join', () => {
        //WIP - need player change hand tests
        let p = new Player(PlayerType.MC).setBankroll(1000);
        p.join(GC.delegator);

        expect(p.numOfHands()).toStrictEqual(1);
        expect(p.getCurrentHand().getBet()).toStrictEqual(GC.getRules().minBet);
    });

    it('Can properly process change hand commands from player', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000);
        let a1 = new Player(PlayerType.NPC).setBankroll(10000);

        p.join(maxFourGC.delegator);
        p.changeHandTo(3).changeHandTo(2);
        a1.join(maxFourGC.delegator);
        a1.changeHandTo(2);

        expect(maxFourGC.getPlayers()[0].numOfHands()).toStrictEqual(2); //for player p
        expect(maxFourGC.getPlayers()[1].numOfHands()).toStrictEqual(2); //for player a1
    });

    it('Can prevent invalid change hand commands from player (max)', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000);
        let a1 = new Player(PlayerType.NPC).setBankroll(10000);

        p.join(maxFourGC.delegator);
        p.changeHandTo(3);
        a1.join(maxFourGC.delegator);
        a1.changeHandTo(2); //should be invalid so numOfHands should still be 1

        expect(maxFourGC.getPlayers()[0].numOfHands()).toStrictEqual(3); //for player p
        expect(maxFourGC.getPlayers()[1].numOfHands()).toStrictEqual(1); //for player a1
    });

    it('Can prevent invalid change hand commands from player (min of 1)', () => {
        let p = new Player(PlayerType.MC).setBankroll(10000);
        let a1 = new Player(PlayerType.NPC).setBankroll(10000);

        p.join(maxFourGC.delegator);
        p.changeHandTo(3).changeHandTo(-1);
        a1.join(maxFourGC.delegator);
        a1.changeHandTo(0); //should be invalid so numOfHands should still be 1

        expect(maxFourGC.getPlayers()[0].numOfHands()).toStrictEqual(3); //for player p
        expect(maxFourGC.getPlayers()[1].numOfHands()).toStrictEqual(1); //for player a1
    });

    it('Can follow double down rules', () => {
        const ddOn789: PlayRuleOption = Object.assign({}, defaultRules, {
            doubleDownOn: [7, 8, 9],
        });
        const ddOn12: PlayRuleOption = Object.assign({}, defaultRules, { doubleDownOn: [12] });
        const noDD: PlayRuleOption = Object.assign({}, defaultRules, { doubleDownOn: false });
        const gc = new GameController(dummyDeck);
        const gc1 = new GameController(dummyDeck, 'DD on 7,8,9', ddOn789);
        const gc2 = new GameController(dummyDeck, 'DD only on 12', ddOn12);
        const gc3 = new GameController(dummyDeck, 'No DD', noDD);
        const h1 = new Hand(new Card('2'), 50).dealSecondCard(new Card('7')); //value: 9
        const h2 = new Hand(new Card('2'), 50).dealSecondCard(new Card('10')); //value: 12
        const h3 = new Hand(new Card('2'), 50).dealSecondCard(new Card('2')); //value: 4
        const h4 = new Hand(new Card('A'), 50).dealSecondCard(new Card('A')); //value: 2, 12

        const gc_h1 = gc.delegator.canDoubleDown(h1); //true
        const gc_h2 = gc.delegator.canDoubleDown(h2); //true
        const gc_h3 = gc.delegator.canDoubleDown(h3); //true
        const gc_h4 = gc.delegator.canDoubleDown(h4); //true

        const gc1_h1 = gc1.delegator.canDoubleDown(h1); //true
        const gc1_h2 = gc1.delegator.canDoubleDown(h2); //false
        const gc1_h3 = gc1.delegator.canDoubleDown(h3); //false
        const gc1_h4 = gc1.delegator.canDoubleDown(h4); //false

        const gc2_h1 = gc2.delegator.canDoubleDown(h1); //false
        const gc2_h2 = gc2.delegator.canDoubleDown(h2); //true
        const gc2_h3 = gc2.delegator.canDoubleDown(h3); //false
        const gc2_h4 = gc2.delegator.canDoubleDown(h4); //true

        const gc3_h1 = gc3.delegator.canDoubleDown(h1); //false
        const gc3_h2 = gc3.delegator.canDoubleDown(h2); //false
        const gc3_h3 = gc3.delegator.canDoubleDown(h3); //false
        const gc3_h4 = gc3.delegator.canDoubleDown(h4); //false

        expect(gc_h1).toStrictEqual(true);
        expect(gc_h2).toStrictEqual(true);
        expect(gc_h3).toStrictEqual(true);
        expect(gc_h4).toStrictEqual(true);

        expect(gc1_h1).toStrictEqual(true);
        expect(gc1_h2).toStrictEqual(false);
        expect(gc1_h3).toStrictEqual(false);
        expect(gc1_h4).toStrictEqual(false);

        expect(gc2_h1).toStrictEqual(false);
        expect(gc2_h2).toStrictEqual(true);
        expect(gc2_h3).toStrictEqual(false);
        expect(gc2_h4).toStrictEqual(true);

        expect(gc3_h1).toStrictEqual(false);
        expect(gc3_h2).toStrictEqual(false);
        expect(gc3_h3).toStrictEqual(false);
        expect(gc3_h4).toStrictEqual(false);
    });
});
