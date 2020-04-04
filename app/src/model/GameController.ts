//WIP:
// canSplit logic (not needed for mvp)

import defaultRules, { PlayRuleOption } from './PlayRule';
import defaultConfig, { GameConfiguration } from './GameConfig';
import Player, { PlayerInterface, PlayerType } from './Player';

import Notifier from './Notifier';
import { Statistics, Tracker } from './Statistics';
import { PlayingHand } from './Hand';
import Card from './Card';
import CardCollection, { CardCollectionInterface } from './CardCollection';

import CycleDataType from './CycleDataType';

export interface GameFlowInterface {
    order: number;
    position: number;
    player?: PlayerInterface;
}

export enum GameActionPhase {
    START, //new player can join if rules allow
    BET,
    DEAL,
    PLAY,
    HOUSE,
    CHECK,
    PAYOUT,
    END,
}

export interface GameControl {
    // readonly rule: PlayRuleOption
    // readonly config: GameConfiguration
    delegator: GameControlDelegator;
    gid: string;

    //Table related
    getRules: () => PlayRuleOption;
    getConfig: () => GameConfiguration;
    getDealer: () => PlayerInterface;
    isPositionEmpty: (pos: number) => boolean;
    getNextOpenPosition: () => number | null;
    getEmptyPositions: () => GameFlowInterface[];

    //Player related
    getTotalHands: (players: PlayerInterface[]) => number;
    getTotalPlayers: () => number;
    addPlayer: (player: PlayerInterface, pos: number) => void;
    removePlayer: (player: PlayerInterface) => void;
    getPlayers: () => PlayerInterface[];
    checkHandRestrictions: (players: PlayerInterface[]) => boolean;

    //Flow Control related
    isGameStarted: () => boolean;
    getFlowOrder: () => GameFlowInterface[];
    updateFlowOrder: (byPos: number, withPlayer: PlayerInterface) => GameControl;
    getPlayerFlowOrder: () => GameFlowInterface[];
    startGame: (withShoe?: CardCollectionInterface) => boolean;
    stopGame: () => GameControl;
    getPhase: () => CycleDataType;
    phaseCycle: CycleDataType;

    //Shoe related
    getShoe: () => CardCollectionInterface;
    getDealtBin: () => CardCollectionInterface;
    burnCard: (amt: number) => GameControl;
    cleanup: (withShoe?: CardCollectionInterface) => GameControl;
    shuffle: () => GameControl;
    dealRound: () => GameControl;
}

class GameController implements GameControl {
    public gid: string;
    public delegator: GameControlDelegator = new GameDelegator(this);
    public phaseCycle: CycleDataType = new CycleDataType(
        GameActionPhase.START,
        GameActionPhase.BET,
        GameActionPhase.DEAL,
        GameActionPhase.PLAY,
        GameActionPhase.HOUSE,
        GameActionPhase.CHECK,
        GameActionPhase.PAYOUT,
        GameActionPhase.END
    );
    private rule: PlayRuleOption = defaultRules;
    private config: GameConfiguration = defaultConfig;
    private dealer: PlayerInterface = new Player(PlayerType.Dealer);
    private shoe: CardCollectionInterface;
    private backupShoe: CardCollectionInterface; //this is a clone of shoe, used when resetting
    private dealtCards: CardCollectionInterface; //the card pile thats used
    private flowOrder: GameFlowInterface[];

    private players: PlayerInterface[] = [];
    private shoeInProgress: boolean = false;
    private tracker: Tracker = new Statistics();

    constructor(
        shoe: CardCollectionInterface,
        id: string = 'GameController',
        rule: PlayRuleOption = defaultRules,
        config: GameConfiguration = defaultConfig
    ) {
        this.gid = id;
        this.rule = rule;
        this.config = config;
        this.shoe = shoe;
        this.backupShoe = shoe.clone();
        this.dealtCards = new CardCollection();

        this.flowOrder = [...Array(this.config.tableMaxHands)].map((_, i) => {
            const gameFlow: GameFlowInterface = {
                order: i,
                position: i,
                player: undefined,
            };
            return gameFlow;
        });

        const dealerFlow: GameFlowInterface = {
            order: -1,
            position: -1,
            player: this.dealer,
        };

        this.flowOrder.push(dealerFlow);
    }

    isGameStarted = () => this.shoeInProgress;

    cleanup = (withShoe?: CardCollectionInterface) => {
        //clean up prev shoe stuff
        if (withShoe) {
            //use new shoe
            this.shoe = withShoe;
            this.backupShoe = withShoe.clone();
        } else {
            this.shoe = this.backupShoe.clone(); //or reuse current shoe and just shuffle it
        }

        this.dealtCards = new CardCollection();
        this.shoeInProgress = false;
        return this;
    };

    /**
     * Start the game. I.E Burn the top card and ready to start the very first round of this game
     */
    startGame = (withShoe?: CardCollectionInterface) => {
        this.cleanup(withShoe).shuffle().burnCard();

        if (!this.isGameStarted()) {
            throw new Error('Failed to start game!');
        }
        return this.isGameStarted();
    };

    stopGame = () => {
        this.cleanup();
        this.shoeInProgress = false;
        return this;
    };

    shuffle = () => {
        this.getShoe().shuffle(this.config.shuffleRepeats);
        return this;
    };

    /**
     * This is method that signals the start of the game. IT SHOULD ONLY BE CALLED AT THE VERY START OF GAME
     */
    burnCard = (amt: number = 1) => {
        let burnCards: Card[] = [];
        let err: boolean = false;
        for (let i = 0; i < amt; i++) {
            let dealtCard = this.getShoe().deal();
            if (dealtCard) {
                burnCards.push(dealtCard);
            } else {
                Notifier.error('No cards dealt. Cannot burn card. Start game failed');
                err = true;
                break;
            }
        }

        this.getDealtBin().addCard(burnCards);
        this.shoeInProgress = !err;
        return this;
    };

    dealRound = () => {
        if (!this.isGameStarted()) {
            Notifier.error('Game did not start yet');
            return this;
        }

        //Dealing first card
        let firstDealPassed = this.dealLoop(true);
        if (firstDealPassed) {
            //Dealing second card
            this.dealLoop(false);
        }

        return this;
    };

    //Not in interface, only used when dealing the initial hand cards
    private dealHandCardsTo = (player: PlayerInterface, first: boolean) => {
        //NEED TO TAKE CARE OF OTHER PLAYER HANDS HERE
        return this.checkDealtCard(
            this.getShoe().deal(),
            (card: Card) => {
                if (first) {
                    player.getCurrentHand().dealFirstCard(card);
                } else {
                    player.getCurrentHand().dealSecondCard(card);
                }
                return true;
            },
            () => {
                this.stopGame();
                return false;
            }
        );
    };

    //Not in the interface
    private dealLoop = (first: boolean) => {
        let dealSuccessfully: boolean = false;
        for (let i = 0; this.getPlayerFlowOrder().length; i++) {
            let p = this.getPlayerFlowOrder()[i].player!; //this.getPlayerFlowOrder ensures theres valid player
            dealSuccessfully = this.dealHandCardsTo(p, first);
            if (!dealSuccessfully) {
                break;
            }
        }

        if (!dealSuccessfully) {
            return false;
        }

        //Deal dealer card, returns if dealer is successfully dealt a card or not
        return this.dealHandCardsTo(this.getDealer(), first);
    };

    //not in interface
    private checkDealtCard = (card: Card | undefined, passFn: Function, failFn?: Function) => {
        if (card) {
            return passFn(card);
        } else {
            Notifier.error('Ran out of cards during game. Auto stopped');
            if (failFn) {
                return failFn();
            }
        }
    };

    /**
     * Returns the entire flow order (including empty seats)
     */
    getFlowOrder = () => {
        return this.flowOrder;
    };

    updateFlowOrder = (byPos: number, withPlayer: PlayerInterface) => {
        if (byPos < 0) {
            Notifier.error('Cannot update dealer position!');
            return this;
        } else {
            this.getFlowOrder()[byPos].player = withPlayer;
        }
        return this;
    };

    isPositionEmpty = (pos: number) => {
        return typeof this.getFlowOrder()[pos].player == 'undefined';
    };

    /**
     * Returns the flowOrder obj with valid players (Dealer excluded)
     * */
    getPlayerFlowOrder = () => {
        return this.getFlowOrder().filter(
            (fo) => typeof fo.player != 'undefined' && fo.player.getType() != PlayerType.Dealer
        );
    };

    /**
     * Returns the phase cycle
     */
    getPhase = () => {
        return this.phaseCycle;
    };

    getEmptyPositions = () => {
        return this.getFlowOrder().filter((fo) => typeof fo.player == 'undefined');
    };

    //Returns the next avail position, returns null if non are open
    getNextOpenPosition = () => {
        let openPos = this.getEmptyPositions();
        if (openPos.length > 0) {
            return openPos[0].position;
        } else {
            return null;
        }
    };

    checkHandRestrictions = (players: PlayerInterface[]) => {
        let { tableMaxHands } = this.config;
        let initNumHands = this.getTotalHands(players);
        if (initNumHands > tableMaxHands) {
            Notifier.error(
                `The total number of hands (${initNumHands}) can not be greater than ${tableMaxHands}!`
            );
            return false;
        }

        if (!this.checkAllPlayerHands(players)) {
            return false;
        }

        return true;
    };

    getPlayers() {
        return this.players;
    }

    getTotalPlayers() {
        return this.players.length;
    }

    getTotalHands(players: PlayerInterface[] = this.players) {
        let totalHands = 0;
        players.forEach((p) => (totalHands += p.numOfHands()));
        return totalHands;
    }

    checkHandsPerPlayer(player: PlayerInterface) {
        if (player.numOfHands() > this.config.maxHands) {
            Notifier.error(`A single player may not play more than ${this.config.maxHands} hands!`);
            return false;
        } else {
            return true;
        }
    }

    checkAllPlayerHands(players: PlayerInterface[]) {
        return players.every((p) => this.checkHandsPerPlayer(p));
    }

    addPlayer = (player: PlayerInterface, pos: number) => {
        //At this point, all condition to add player passed
        this.updateFlowOrder(pos, player);
        this.players.push(player);
    };

    removePlayer = (player: PlayerInterface) => {};

    getShoe = () => {
        return this.shoe;
    };

    getDealtBin = () => {
        return this.dealtCards;
    };

    getRules = () => {
        return this.rule;
    };

    getConfig = () => {
        return this.config;
    };

    getDealer = () => {
        return this.dealer;
    };
}

export interface GameControlDelegator {
    next: (player: PlayerInterface) => any;
    register: (player: PlayerInterface, pos?: number) => boolean;
    unregister: (player: PlayerInterface) => boolean;
    getOpenHands: () => number;
    getMinBet: () => number;
    getMaxBet: () => number;
    getDealerShowingCard: () => Card | undefined;
    canDoubleDown: (withHand: PlayingHand) => boolean;
    canSplit: (withHand: PlayingHand) => boolean;
    canInsurance: () => boolean;
    canSurrender: () => boolean;
    deal: () => Card | undefined;
    getMinBetForNumHands: (numHands: number) => number;
    getGameID: () => string;
    getPlayerPosition: (player: PlayerInterface) => number | null;
}

//Separated delegation methods from controller
class GameDelegator implements GameControlDelegator {
    private controller: GameControl;
    constructor(controller: GameControl) {
        this.controller = controller;
    }

    getGameID() {
        return this.controller.gid;
    }

    deal() {
        const dealtCard = this.controller.getShoe().deal();
        if (!dealtCard) {
            Notifier.error("GameController can't deal card. Shoe is empty");
        }
        return dealtCard;
    }

    next(player: PlayerInterface) {
        //Signals from Player class to tell the GameController to move onto either:
        // 1) next hand of the same Player
        // 2) next Player
        // 3) End round and begin calculating phase
        // 4) Finish calculated results (payout or collect wins)
        // 5) Wait for betSize / numHand changes from all players
        // 6) Start a new round
        // 7) End shoe and begin shuffle
        // 8) Start shoe (put top card away and deal 1st round)

        //Player needs to have position set to use as indicator ?
        //Finish the flow control
        const currentPos = player.getPosition();
        if (player.hasNextHand()) {
            player.toNextHand().startHand();
        } else {
        }

        Notifier.notify('Delegation method called');
    }

    register(player: PlayerInterface, pos?: number) {
        if (player.getType() == PlayerType.Dealer) {
            return false;
        }

        let openHands = this.getOpenHands();
        if (openHands > 0) {
            let position = typeof pos != 'undefined' ? pos : this.controller.getNextOpenPosition();
            if (position != null) {
                if (this.controller.isPositionEmpty(position)) {
                    player.setDelegator(this).changeHandTo(1); //changeHandTo will auto min bet
                    this.controller.addPlayer(player, position);
                    return true;
                } else {
                    Notifier.error(`Position ${pos} is already occupied!`);
                    return false;
                }
            } else {
                Notifier.error('There are no more open positions!');
                return false;
            }
        }

        return false;
    }

    unregister(player: PlayerInterface) {
        return false;
    }

    getMinBet = () => {
        return this.controller.getRules().minBet;
    };

    getMinBetForNumHands = (numHands: number) => {
        return numHands == 1
            ? this.controller.getRules().minBet
            : this.controller.getRules().betSizeToNumHands * numHands;
    };

    getMaxBet = () => {
        return this.controller.getRules().maxBet;
    };

    getDealerShowingCard = () => this.controller.getDealer().getCurrentHand().getFirstCard();

    getPlayerPosition = (player: PlayerInterface) => {
        let match = this.controller.getFlowOrder().filter((fo) => fo.player == player);
        if (match.length > 0) {
            return match[0].position;
        } else {
            return null;
        }
    };

    canSplit = (withHand: PlayingHand) => {
        const firstCard = withHand.getFirstCard();
        const secondCard = withHand.getSecondCard();
        const rule = this.controller.getRules();
        if (withHand.getTotalCards() != 2 || !firstCard || !secondCard) {
            return false;
        }

        if (firstCard.getKey() != secondCard.getKey()) {
            return false;
        }

        //After this point, firstCard == secondCard
        if (firstCard.getKey() == 'A') {
            return this.canSplitAces(withHand);
        }

        if (typeof rule.splitOn == 'boolean') {
            //This also means strictSplit is false
            return rule.splitOn;
        } else {
            //Need to account for
            //      1) # of splits (WIP... how to do it)
            //      2) strict splitting (QQ vs QK etc) (in QA)

            // Ace case is taken care of above
            if (rule.splitOn.includes(firstCard.getValue()[0])) {
                if (rule.strictSplit) {
                    return firstCard.getKey() == secondCard.getKey();
                } else {
                    return true;
                }
            }

            return false;
        }
    };

    canSplitAces = (withHand: PlayingHand) => {
        return false;
    };

    canDoubleDown = (withHand: PlayingHand) => {
        const rule = this.controller.getRules();
        if (withHand.getTotalCards() != 2) {
            return false;
        }
        if (typeof rule.doubleDownOn == 'boolean') {
            return rule.doubleDownOn;
        } else {
            const [hard, soft] = withHand.getValue();
            return rule.doubleDownOn.includes(hard) || rule.doubleDownOn.includes(soft);
        }
    };

    canInsurance = () => {
        const show = this.getDealerShowingCard();
        if (show) {
            return show.getKey() == 'A';
        } else {
            Notifier.error('Dealer has no cards.');
            return false;
        }
    };

    canSurrender = () => {
        return this.controller.getRules().surrender;
    };

    getOpenHands = () => {
        return (
            this.controller.getConfig().tableMaxHands -
            this.controller.getTotalHands(this.controller.getPlayers())
        );
    };
}

export { GameDelegator };
export default GameController;
