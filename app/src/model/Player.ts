import Hand, { PlayingHand } from './Hand';
import { GameDelegatorInterface } from './GameDelegator';
import Card from './Card';

import Notifier from './Notifier';

export enum PlayerType {
    MC,
    NPC,
    Dealer,
}

/**
 * This doesn't include insurance since its a special flow
 */
export enum PlayActionName {
    stand = 'Stand',
    dd = 'Double Down',
    split = 'Split',
    surrender = 'Surrender',
    hit = 'Hit',
}
export interface PlayerActionInterface {
    name: string;
    can: boolean;
    action: () => any;
}

export interface PlayerActionSelection {
    [key: string]: PlayerActionInterface;
}

export interface PlayerInterface {
    active: boolean;
    isSitOut: boolean;
    // numHands: number
    // hands: PlayingHand[]
    // currentHand: PlayingHand

    getBankroll: () => number;
    updateBankroll: (amount: number) => PlayerInterface;
    setBankroll: (to: number) => PlayerInterface;
    hasEnoughBankroll: (amount: number, useBankroll?: number) => boolean;

    decideBet: () => boolean;
    // decideInsurance: () => boolean;
    // decideEvenPay: () => void;

    //used by PlayPhaseControll
    takeInsuranceAction: () => PlayerInterface;
    setDealerInsuranceBJPayoutModifier: () => PlayerInterface;
    setLooseInsurancePayoutModifier: () => PlayerInterface;
    playAction: (dealerShowCard: Card) => PlayerInterface;
    getAvailablePlayActions: () => PlayerActionSelection;
    getShowCard: () => Card; //for dealer...

    canHit: () => boolean;
    canSplit: () => boolean;
    canDoubleDown: () => boolean;
    canInsurance: () => boolean;

    hit: () => PlayerInterface;
    doubleDown: () => PlayerInterface;
    insurance: () => PlayerInterface;
    surrender: () => PlayerInterface;

    completeCurrentHand: () => void;
    // next: () => void

    bet: (amt: number, hand: number) => PlayerInterface;

    changeBetBy: (chane: number) => PlayerInterface;
    changeBetTo: (setTo: number) => PlayerInterface;
    changeHandBy: (change: number) => PlayerInterface;
    changeHandTo: (setTo: number) => PlayerInterface;
    addHand: (change: number) => PlayerInterface;
    removeHand: (change: number) => PlayerInterface;
    numOfHands: () => number;
    join: (game: GameDelegatorInterface, pos?: number) => boolean;
    leave: () => boolean;
    getType: () => PlayerType;
    getGameID: () => string;
    getCurrentHand: () => PlayingHand;
    getTotalBetFromAllHands: () => number;
    setDelegator: (delegator: GameDelegatorInterface) => PlayerInterface;
    getPosition: () => number | null;
    getHands: () => PlayingHand[];
    resetHandOrder: () => PlayerInterface;
    hasNextHand: () => boolean;
    toNextHand: () => PlayerInterface;
}

//Should use this as base and extend into Dealer class and Player/NPC class
//Dealer can't join, always one hand, and the AI is set in stone via game rules
//Whereas NPC/Player class can always follow a custom rule set later on...
export default class Player implements PlayerInterface {
    public active: boolean;
    public isSitOut: boolean = false;
    // private numHands: number
    private bankroll: number = 0;
    private currentHandIndex: number = 0;
    private hands: PlayingHand[];
    private type: PlayerType;
    private delegator?: GameDelegatorInterface;

    constructor(
        type: PlayerType = PlayerType.NPC,
        delegator?: GameDelegatorInterface,
        hands?: PlayingHand[],
        bankroll?: number
    ) {
        this.type = type;
        if (hands) {
            this.hands = hands;
            this.active = true;
        } else {
            this.hands = [new Hand(undefined, type)];
            this.active = false;
        }
        this.currentHandIndex = 0;

        if (bankroll) {
            this.setBankroll(bankroll);
        }

        if (delegator) {
            this.delegator = delegator;
            this.delegator.register(this);
        }
    }

    /**
     * Use to decide if the operator will proceed with the bet phase action
     * Returning true means the user will place a bet
     */
    decideBet = () => {
        //This will contain logic to simulate user decision for npc players
        return true;
    };

    /**
     * When dealer asks for insurance and player hand is BJ, ask for even pay option
     */
    decideEvenPay = () => {
        const hand = this.getCurrentHand();
        if (hand.isBlackJack) {
            //make all true for now
            hand.isEvenPay = true;
            return true; //if hand is BJ, there is only even pay or normal flow, no insurance bets
        } else {
            hand.isEvenPay = false;
            return false; //means no BJ, so you can take insurance
        }
    };

    /**
     * Use to decide if the operator will buy insurance ()
     * Returning true means the user will place a bet
     */
    decideInsurance = () => {
        if (this.canInsurance()) {
            //run it based on value of the hand
            //dummy logic for now: buy if value >= 19
            const dummyLogic = this.getCurrentHand()
                .getValue()
                .filter((v) => v >= 19);
            return dummyLogic.length > 0;
        } else {
            return false;
        }
    };

    /**
     * Cleans up all insurance related flags (including evenPay).
     * This should be triggered in the PayoutPhase end function
     */
    clearInsuranceFlags = () => {
        const action = () => {
            this.getCurrentHand().clearInsuranceFlags();
        };
        this.applyActionToEachHand(action);
    };

    /**
     * create one or more hands with the bet amt
     */
    bet = (amt: number, hand: number = 1) => {
        this.changeHandTo(hand);
        this.getHands().forEach((hand) => hand.setBet(amt));
        return this;
    };

    /**
     * This resets the player current hand to the first hand
     */
    resetHandOrder = () => {
        this.currentHandIndex = 0;
        return this;
    };

    toNextHand = () => {
        this.currentHandIndex++;
        return this;
    };

    join = (game: GameDelegatorInterface, pos?: number) => {
        if (this.delegator) {
            Notifier.warn(`Player (${PlayerType[this.getType()]}) is already in a game!`);
            return false;
        }

        if (game.register(this, pos)) {
            Notifier.notify(`Player (${PlayerType[this.getType()]}) Joined Successfully!`);
            this.delegator = game;
            return true;
        } else {
            Notifier.notify(`Player (${PlayerType[this.getType()]}) Cannot Join Game!`);
            return false;
        }
    };

    getBankroll = () => {
        return this.bankroll;
    };

    /**
     * This updates the bankroll of the player (relative)
     * @param {number} amount - updates the bankroll relatively by this amt
     */
    updateBankroll = (amount: number) => {
        this.bankroll += amount;
        return this;
    };

    /**
     * This sets the bankroll of the player to an absolute value (absolute)
     * @param {number} to - set absolutely the amt of the bankroll
     */
    setBankroll = (to: number) => {
        this.bankroll = to;
        return this;
    };

    hasEnoughBankroll = (amount: number, useBankroll?: number) => {
        if (amount > 0) {
            return typeof useBankroll != 'undefined'
                ? useBankroll >= amount
                : this.getBankroll() >= amount;
        } else {
            return false;
        }
    };

    //This is not in any interface atm
    //Requirements that all actions need to pass (only bankroll so far)
    //Bind this to action UI fn
    actionRequirements = (actionCheck: () => boolean) => {
        const hand = this.getCurrentHand();
        if (hand.isHandDone) {
            return false;
        } else if (this.hasEnoughBankroll(hand.getBet())) {
            return actionCheck();
        } else {
            return false;
        }
    };

    //This is triggered when GameController runs register(Player) direct without going through Player class
    setDelegator = (delegator: GameDelegatorInterface) => {
        this.delegator = delegator;
        return this;
    };

    leave = () => {
        if (this.delegator) {
            if (this.delegator.unregister(this)) {
                Notifier.notify(`Player (${PlayerType[this.getType()]}) Left Successfully!`);
                this.delegator = undefined;
                return true;
            } else {
                Notifier.notify(`Player (${PlayerType[this.getType()]}) Cannot leave Game!`);
                return false;
            }
        } else {
            Notifier.error(`Player (${PlayerType[this.getType()]}) is not in a game!`);
            return false;
        }
    };

    canHit: () => boolean = () => {
        const hand = this.getCurrentHand();
        if (hand.isHandDone) {
            return false;
        }

        return !this.getCurrentHand().isBusted;
    };

    canSplit: () => boolean = () => {
        if (this.delegator && this.hasEnoughBankroll(this.getCurrentHand().getBet())) {
            return this.delegator.canSplit(this.getCurrentHand());
        }
        return false;
    };

    canDoubleDown: () => boolean = () => {
        if (this.delegator && this.hasEnoughBankroll(this.getCurrentHand().getBet())) {
            return this.delegator.canDoubleDown(this.getCurrentHand());
        }
        return false;
    };

    canInsurance: () => boolean = () => {
        if (this.delegator && this.hasEnoughBankroll(this.getCurrentHand().getBet() / 2)) {
            return true;
        }
        return false;
    };

    canSurrender = () => {
        //Will need to add cond to disable surrender when split
        if (this.delegator && this.getCurrentHand().getTotalCards() == 2) {
            return this.delegator.canSurrender();
        }
        return false;
    };

    /**
     * Returns a PlayerActionSelection object with all the available actions for current hand and hand state
     */
    getAvailablePlayActions = () => {
        let availableActions: PlayerActionSelection = {};
        const allActions: PlayerActionInterface[] = [
            {
                name: PlayActionName.stand,
                can: true,
                action: this.completeCurrentHand,
            },
            {
                name: PlayActionName.hit,
                can: this.canHit(),
                action: this.hit,
            },
            {
                name: PlayActionName.dd,
                can: this.actionRequirements.call(this, this.canDoubleDown),
                action: this.doubleDown,
            },
            {
                name: PlayActionName.split,
                can: this.actionRequirements.call(this, this.canSplit),
                action: this.split,
            },
            {
                name: PlayActionName.surrender,
                can: this.canSurrender(),
                action: this.surrender,
            },
        ];

        allActions
            .filter((action) => action.can)
            .forEach((availAction) => {
                availableActions[availAction.name] = availAction;
            });

        return availableActions;
    };

    hit = () => {
        const card = this.delegator!.deal(); //bang operator should be fine...
        if (card) {
            this.getCurrentHand().hit(card);
        }
        return this;
    };

    /**
     * Action call for doubleDown
     */
    doubleDown = () => {
        const card = this.delegator!.deal(); //bang operator should be fine...
        if (card) {
            this.getCurrentHand().hit(card);
            this.changeBetBy(this.getCurrentHand().getBet()); //POST MVP : allow partial double downs
            this.completeCurrentHand();
        }
        return this;
    };

    /**
     * @interface PlayerInterface
     * Might need to spilt Dealer into its own interface
     * This returns the faced up card of the Dealer hand
     */
    getShowCard = () => {
        return this.getCurrentHand().getDealerShowCard();
    };

    /**
     * @interface PlayerInterface
     * This is called on play phase controller for insurance flow.
     * This function will take care of the player's decision on each hand for insurance
     */
    takeInsuranceAction = () => {
        const action = () => {
            const isEvenPayFlow = this.decideEvenPay();
            if (isEvenPayFlow) {
                //hand is BJ -> even pay or normal flow, no insurance bets
                return;
            }

            //Not BJ so can decide on insurance
            if (this.decideInsurance()) {
                this.insurance();
            }
        };
        return this.applyActionToEachHand(action);
    };

    /**
     * @interface PlayerInterface
     * Call this when the dealer __HAVE__ the insurance BJ.
     * Will handle setting flags for payout phase
     */
    setDealerInsuranceBJPayoutModifier = () => {
        const action = () => {
            const hand = this.getCurrentHand();
            if (hand.isEvenPay) {
                //isEvenPay = true automatically mean BJ is true
                hand.insurancePayoutModifier = 1; //payout at 1:1, regular payout phase will pay zero due to game hadInsurance flag (BJ is a tie)
                return;
            }

            if (hand.isInsured) {
                hand.insurancePayoutModifier = 2; //payout double for insuredAmt, Regular payout phase will collect bet size (which makes it even)
            } else {
                hand.insurancePayoutModifier = 0; //not insured, do nothing for insurance. Regular payout phase will collect bet size
            }
        };

        return this.applyActionToEachHand(action);
    };

    /**
     * @interface PlayerInterface
     * Call this when the dealer __DOES NOT__ have the insurance BJ
     */
    setLooseInsurancePayoutModifier = () => {
        const action = () => {
            this.getCurrentHand().insurancePayoutModifier = -1; //collect the insurance amt since dealer does not have BJ
        };
        return this.applyActionToEachHand(action);
    };

    /**
     * @interface PlayerInterface
     * Call this for PlayPhase normal flow (this is NOT for DEALER type)
     * @param {Card} dealerShowCard - the value of the dealer show card
     */
    playAction = (dealerShowCard: Card) => {
        const action = () => {
            const hand = this.getCurrentHand();
            while (!hand.isHandDone) {
                const availActions = this.getAvailablePlayActions();
                //simple logic for now
                //stand if dealer is 4, 5, 6 face up
                //hit until soft 17 or 17 and up
                //unless it is 10 or 11 then do doubledown
                const value = hand.getHighestValue();
                try {
                    if (dealerShowCard.isOneOf([4, 5, 6])) {
                        if (availActions[PlayActionName.dd]) {
                            //in case if they can't dd due to bankroll etc
                            availActions[PlayActionName.dd].action();
                        } else {
                            availActions[PlayActionName.stand].action();
                        }
                    } else if (value >= 17) {
                        availActions[PlayActionName.stand].action();
                    } else if (value == 10 || value == 11) {
                        if (availActions[PlayActionName.dd]) {
                            //in case if they can't dd due to bankroll or 3 card+ 10 / 11
                            availActions[PlayActionName.dd].action();
                        } else {
                            availActions[PlayActionName.hit].action();
                        }
                    } else {
                        availActions[PlayActionName.hit].action();
                    }
                } catch (e) {
                    hand.isHandDone = true; //force stop
                    Notifier.error(e); //this is a critical error
                }
            }
        };

        return this.applyActionToEachHand(action);
    };

    /**
     * Function that will apply an action (fn) to each of the player's hand in order
     * This will call resetHandOrder at the beginning of the fn and at the end of the fn
     * @param {function} action - action function to call for each hand
     */
    applyActionToEachHand = (action: () => any) => {
        this.resetHandOrder();
        action();
        while (this.hasNextHand()) {
            this.toNextHand();
            action();
        }
        this.resetHandOrder();
        return this;
    };

    /**
     * dont think I need this in interface
     */
    insurance = () => {
        if (this.canInsurance()) {
            //POST MVP - allow partial insurance (should be in buyInsurance call)
            const insuredAmt = this.getCurrentHand().buyInsurance().getInsuredAmt();
            this.updateBankroll(-1 * insuredAmt);
        } else {
            Notifier.warn('Can not insure this hand');
        }
        return this;
    };

    /**
     * THIS IS POST MVP
     * DONT THINK I NEED THIS IN INTERFACE
     */
    split = () => {
        return this;
    };

    /**
     * THIS IS POST MVP??
     * DONT THINK I NEED THIS IN INTERFACE
     */
    surrender = () => {
        return this;
    };

    completeCurrentHand: () => void = () => {
        this.getCurrentHand().stand();
    };

    betToMin = () => {
        const min = this.delegator ? this.delegator.getMinBet() : 0;
        return this.changeBetTo(min);
    };

    betToMax = () => {
        const max = this.delegator ? this.delegator.getMaxBet() : 0;
        return this.changeBetTo(max);
    };

    changeBetBy = (change: number) => {
        return this.changeBetTo(this.getCurrentHand().getBet() + change);
    };

    changeBetTo = (setTo: number) => {
        if (!this.delegator) {
            Notifier.warn('Player is not in a game, can not change bet');
            return this;
        }

        // + means an increase in bet amount -> check bankroll has enough for the difference
        // - means a decrease in bet amount -> always ok
        let changeInBet = setTo - this.getCurrentHand().getBet();
        if (changeInBet > 0 && !this.hasEnoughBankroll(changeInBet)) {
            Notifier.warn(`Player does NOT have sufficient bankroll.`);
            return this;
        }

        const min = this.delegator.getMinBet();
        const max = this.delegator.getMaxBet();

        if (setTo < min) {
            // Will need to take care of hasEnoughBankroll checks for auto betting
            //     Notifier.notify(`The minimum bet is ${min}! Auto bet to ${min}.`)
            //     setTo = min
            Notifier.warn(`The minimum bet is ${min}!`);
            return this;
        }

        if (setTo > max) {
            //     Notifier.notify(`The maximum bet is ${max}! Auto bet to ${max}.`)
            //     setTo = max
            Notifier.warn(`The maximum bet is ${max}!`);
            return this;
        }

        //Get back currentHand bet amount to bankroll first
        this.updateBankroll(this.getCurrentHand().getBet());
        this.updateBankroll(-1 * setTo); //subtract setTo bet amount
        this.getCurrentHand().setBet(setTo);
        return this;
    };

    /**
     * Same as changeHandTo but relative
     * I.E. originally have 2 hands. Calling changeHandBy(-1) means remove one hand so total hands become one
     */
    changeHandBy = (change: number) => {
        return this.changeHandTo(this.hands.length + change);
    };

    /**
     * Changes number of player hand to #
     * This will automatically set the hand to the min bet size
     * If number of hand is set to 0, bet size is also removed
     */
    changeHandTo = (setTo: number) => {
        if (!this.delegator) {
            Notifier.warn('Player is not in a game, can not change number of hands');
            return this;
        }

        this.isSitOut = setTo <= 0 ? true : false;

        const minBetPerHand = this.delegator.getMinBetForNumHands(setTo);
        const totalBankrollNeeded = minBetPerHand * setTo;
        const currentTotalBet = this.getTotalBetFromAllHands();

        //For adding hands case
        if (setTo > this.numOfHands()) {
            if (this.delegator.getOpenHands() >= setTo - this.numOfHands()) {
                const extraBankrollNeeded = totalBankrollNeeded - currentTotalBet;
                if (this.hasEnoughBankroll(extraBankrollNeeded)) {
                    this.updateBankroll(-1 * extraBankrollNeeded);
                    this.hands = Array(setTo).fill(new Hand().setBet(minBetPerHand));
                } else {
                    Notifier.warn(`Don't have enough bankroll to play ${setTo} hands!`);
                }
            } else {
                Notifier.warn(
                    `Can not set hands to ${setTo} due to max table size. The table has ${this.delegator.getOpenHands()} spot(s) left.`
                );
            }
        }
        //For lowering hands case
        else if (setTo < this.numOfHands()) {
            if (setTo >= 0) {
                //wont have not enough bet issue
                const bankrollReturned = currentTotalBet - totalBankrollNeeded;
                this.updateBankroll(bankrollReturned);
                this.hands = Array(setTo).fill(new Hand().setBet(minBetPerHand));
            } else {
                Notifier.warn('Can not set hands to lower than 0');
            }
        }
        //For equal case, usually occurs when player join game
        else {
            this.updateBankroll(currentTotalBet); //add back currentTotal
            this.updateBankroll(-1 * totalBankrollNeeded); //take out needed br to bet
            this.hands = Array(setTo).fill(new Hand().setBet(minBetPerHand));
        }

        return this;
    };

    /**
     * Returns all hands for this player
     */
    getHands: () => PlayingHand[] = () => {
        return this.hands;
    };

    //This is strictly for split
    addHand: (change: number) => PlayerInterface = () => {
        return this;
    };

    //This is strictly for split
    removeHand: (change: number) => PlayerInterface = () => {
        return this;
    };

    numOfHands = () => {
        return this.hands.length;
    };

    getType: () => PlayerType = () => {
        return this.type;
    };

    getGameID = () => {
        if (this.delegator) {
            return this.delegator.getGameID();
        } else {
            return 'No game id found';
        }
    };

    getCurrentHand = () => {
        return this.hands[this.currentHandIndex];
    };

    hasNextHand = () => {
        return typeof this.getHands()[this.currentHandIndex + 1] != 'undefined';
    };

    getTotalBetFromAllHands = () => {
        let sum: number = 0;
        this.hands.forEach((h) => {
            sum += h.getBet();
        });
        return sum;
    };

    getPosition: () => number | null = () => {
        return this.delegator ? this.delegator.getPlayerPosition(this) : null;
    };
}

//Need to think about structure...

//Player should control the hands and trigger the fns of Hand class to update the hand
//Player should know about the rules/config (can hit, can split, add more hands, etc), GameController / Hand doesn't know those

//GameController should just maintain the number of Player, Player order, shoe progression, setup the rules/config, and flow of game play

//So GameController controls the Player and Player controls Hand
//GameController does not control Hand
//Hand has the bet amount ? or Player?
