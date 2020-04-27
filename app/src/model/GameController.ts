//WIP:
// canSplit logic (not needed for mvp)

import defaultRules, { PlayRuleOption } from './PlayRule';
import defaultConfig, { GameConfiguration } from './GameConfig';
import Player, { PlayerInterface, PlayerType } from './Player';
import GameDelegator, { GameDelegatorInterface } from './GameDelegator';
import {
    PhaseActionController,
    GameActionPhase,
    PhaseControllerInterface,
} from './PhaseActionController';

import Notifier from './Notifier';
import { Statistics, Tracker } from './Statistics';
import Card from './Card';
import CardCollection, { CardCollectionInterface } from './CardCollection';

import CycleDataType from './CycleDataType';

export interface GameFlowInterface {
    order: number;
    position: number;
    player?: PlayerInterface;
}

/**
 * This is for controlling the game and the game flow
 * Player actions that affects the game and game flow are in GameDelegatorInterface
 */
export interface GameControlInterface {
    // readonly rule: PlayRuleOption
    // readonly config: GameConfiguration
    delegator: GameDelegatorInterface;
    gid: string;
    hadInsurance: boolean;

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
    isAllPlayerHandBusted: () => boolean;

    //Flow Control related
    isGameStarted: () => boolean;
    getFlowOrder: () => GameFlowInterface[];
    updateFlowOrder: (byPos: number, withPlayer: PlayerInterface) => GameControlInterface;
    getPlayerFlowOrder: () => GameFlowInterface[];
    startGame: (withShoe?: CardCollectionInterface) => boolean;
    stopGame: () => GameControlInterface;
    getPhaseCycle: () => CycleDataType;
    getCurrentPhase: () => GameActionPhase;
    phaseCycle: CycleDataType;
    onPhaseEnd: (phase: GameActionPhase) => void;

    //Shoe related
    getShoe: () => CardCollectionInterface;
    getDealtBin: () => CardCollectionInterface;
    burnCard: (amt: number) => GameControlInterface;
    takeCard: () => Card;
    cleanup: (withShoe?: CardCollectionInterface) => GameControlInterface;
    shuffle: () => GameControlInterface;
}

/**
 * Need to clean up and separate cleanly on fns thats should be here or on GameDelegator
 */
class GameController implements GameControlInterface {
    public gid: string;
    public hadInsurance = false;
    public delegator: GameDelegatorInterface = new GameDelegator(this);
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
        //Set the game phase cycle to END phase
        this.phaseCycle.skipToTail();

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

    /**
     * Cleans up shoe (only when start game or end game is called)
     */
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
        this.phaseCycle.skipToTail();
        return this;
    };

    /**
     * Start the game. I.E Burn the top card and ready to start the very first round of this game
     */
    startGame = (withShoe?: CardCollectionInterface) => {
        this.cleanup(withShoe).shuffle().burnCard();
        const successful = this.isGameStarted();
        if (!successful) {
            this.stopGame();
            throw new Error('Failed to start game!');
        }
        this.phaseCycle.next();
        return successful;
    };

    stopGame = () => {
        this.cleanup();
        return this;
    };

    shuffle = () => {
        this.getShoe().shuffle(this.config.shuffleRepeats);
        return this;
    };

    /**
     * This is method that signals the start of the game. IT SHOULD ONLY BE CALLED AT THE VERY START OF GAME
     * Use takeCard() to "hit" or "deal" cards
     */
    burnCard = (amt: number = 1) => {
        let burnCards: Card[] = [];
        let err: boolean = false;
        for (let i = 0; i < amt; i++) {
            let dealtCard = this.getShoe().deal();
            if (dealtCard) {
                burnCards.push(dealtCard);
            } else {
                Notifier.warn('No cards dealt. Cannot burn card. Start game failed');
                err = true;
                break;
            }
        }

        this.getDealtBin().addCard(burnCards);
        this.shoeInProgress = !err;
        return this;
    };

    takeCard: () => Card = () => {
        try {
            const dealtCard = this.getShoe().deal();
            return dealtCard!;
        } catch (e) {
            throw e;
        }
    };

    // dealRound = () => {
    //     if (!this.isGameStarted()) {
    //         Notifier.error('Game did not start yet');
    //         return this;
    //     }

    //     //Dealing first card
    //     let firstDealPassed = this.dealLoop(true);
    //     if (firstDealPassed) {
    //         //Dealing second card
    //         this.dealLoop(false);
    //     }

    //     return this;
    // };

    //Not in interface, only used when dealing the initial hand cards
    // private dealHandCardsTo = (player: PlayerInterface, first: boolean) => {
    //     //NEED TO TAKE CARE OF OTHER PLAYER HANDS HERE
    //     return this.checkDealtCard(
    //         this.getShoe().deal(),
    //         (card: Card) => {
    //             if (first) {
    //                 player.getCurrentHand().dealFirstCard(card);
    //             } else {
    //                 player.getCurrentHand().dealSecondCard(card);
    //             }
    //             return true;
    //         },
    //         () => {
    //             this.stopGame();
    //             return false;
    //         }
    //     );
    // };

    /**
     * Don't need this anymore... this is handled in BetPhaseController.action
     */
    //Not in the interface
    // private dealLoop = (first: boolean) => {
    //     let dealSuccessfully: boolean = false;
    //     for (let i = 0; this.getPlayerFlowOrder().length; i++) {
    //         let p = this.getPlayerFlowOrder()[i].player!; //this.getPlayerFlowOrder ensures theres valid player
    //         dealSuccessfully = this.dealHandCardsTo(p, first);
    //         if (!dealSuccessfully) {
    //             break;
    //         }
    //     }

    //     if (!dealSuccessfully) {
    //         return false;
    //     }

    //     //Deal dealer card, returns if dealer is successfully dealt a card or not
    //     return this.dealHandCardsTo(this.getDealer(), first);
    // };

    //not in interface
    // private checkDealtCard = (card: Card | undefined, passFn: Function, failFn?: Function) => {
    //     if (card) {
    //         return passFn(card);
    //     } else {
    //         Notifier.error('Ran out of cards during game. Auto stopped');
    //         if (failFn) {
    //             return failFn();
    //         }
    //     }
    // };

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
     * Go to the next phase
     */
    goNextPhase = () => {
        this.getPhaseCycle().next();
    };

    /**
     * Returns the phase cycle
     */
    getPhaseCycle = () => {
        return this.phaseCycle;
    };

    /**
     * Returns current action phase
     */
    getCurrentPhase: () => GameActionPhase = () => {
        return this.getPhaseCycle().get();
    };

    /**
     * Begin round
     */
    beginRound = () => {};

    beginPhaseAction = () => {
        const phase = this.getCurrentPhase();
        const phaseControl: PhaseControllerInterface = new PhaseActionController(phase).get();
        phaseControl.action(this);
    };

    /**
     * @interface GameControlInterface
     * Callback that is triggered by inside PhaseControllerInterface.end fn (which is triggered by PhaseControllerInterface.action)
     */
    onPhaseEnd = (phase: GameActionPhase) => {
        this.getPhaseCycle().next();
    };

    /**
     * @interface GameControlInterface
     * Checks if all player hands are busted.
     */
    isAllPlayerHandBusted = () => {
        return this.getPlayerFlowOrder().every((fo) => fo.player!.areAllHandsBusted());
    };

    /**
     * Go to the next phase
     */
    nextPhase = () => {
        this.phaseCycle = this.getPhaseCycle().next();
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

    /**
     * Returns the game rules
     * Game rule consists of game settings like min/max bet, max # of hands per player, rules for double down etc
     */
    getRules = () => {
        return this.rule;
    };

    /**
     * Returns the config of the game
     * This is for settings that are same for across games, like max table seating (hands), cut penetration, shuffle method, number of shuffles etc
     */
    getConfig = () => {
        return this.config;
    };

    getDealer = () => {
        return this.dealer;
    };
}

export default GameController;
