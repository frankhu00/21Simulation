import Card from './Card';
import Notifier from './Notifier';
import { PlayerType } from './Player';

export interface PlayingHand {
    hit: (card: Card) => PlayingHand;
    stand: () => PlayingHand;
    split: () => PlayingHand[];
    surrender: () => void;
    buyInsurance: () => PlayingHand;
    doDoubleDown: () => PlayingHand;
    computeValue: () => void;
    dealFirstCard: (card: Card) => PlayingHand;
    dealSecondCard: (card: Card) => PlayingHand;
    getFirstCard: () => Card | undefined;
    getSecondCard: () => Card | undefined;
    getValue: () => number[];
    getRawValue: () => number[];
    getHighestValue: () => number;
    getTotalCards: () => number;
    getBet: () => number;
    setBet: (bet: number) => PlayingHand;
    showDealerCard: () => PlayingHand;
    getDealerShowCard: () => Card;
    getInsuredAmt: () => number;
    clearInsuranceFlags: () => void;

    // firstCard?: Card,
    // secondCard?: Card,
    // handCards: Card[]
    // value: number[] //for cases like soft 17
    // bet: number
    /** tracks whether or not the hand has finished all of its actions (did stand get called?) */
    isHandDone: boolean;
    isDealer: boolean;
    isControllable: boolean;
    isBusted: boolean;
    isBlackJack: boolean;
    isHandValid: boolean;
    isEmptyHand: boolean;
    /** for players - determines if the player insured the hand */
    isInsured: boolean;
    /** tracks how much the player insured this hand, if player takes even pay, set this to hand bet size (and `insurancePayoutModifier` to 1) */
    insuredAmt: number;
    /** tracks if player wants even pay in case of insurance and player BJ */
    isEvenPay: boolean;

    /**
     * tracks the insurance payout modifier.
     *
     * I.E if it is 1, then it means the player had BJ and took even pay during insurance flow (house pays 1xinsuredAmt, game flag hadInsurance causes regular payout to be 0 [tie])
     *  If 2, then it means player took insurance and dealer had BJ (house pays 2xinsuredAmt).
     *  If -1, then it means player took insurance but no BJ (house takes -1xinsuredAmt).
     *  If 0, then it means player had BJ but didn't take even pay and dealer BJ (because its a tie, so house pay 0xinsuredAmt and game flag hadInsurance causes regular payout to be 0 [tie]).
     */
    insurancePayoutModifier: number;

    /** for dealer - true if dealer has ace faced up */
    isDealerAceUp: boolean;
    playerType: PlayerType;
}

class Hand implements PlayingHand {
    private firstCard?: Card = undefined;
    private secondCard?: Card = undefined;
    private handCards: Card[] = [];
    private bet: number = 0;
    private value: number[] = [0];

    public isHandDone = false;
    public insuredAmt: number = 0;
    public isHandValid: boolean = false;
    public isBusted: boolean = false;
    public isDealer: boolean = false;
    public isControllable: boolean = false;
    public isBlackJack: boolean = false;
    public isInsured: boolean = false;
    public isEvenPay: boolean = false;
    public insurancePayoutModifier = 0;
    public isEmptyHand: boolean = true;
    public isDealerAceUp: boolean = false;
    public playerType: PlayerType;

    constructor(firstCard?: Card, bet?: number, playerType: PlayerType = PlayerType.NPC) {
        this.playerType = playerType;

        this.bet = bet ? bet : 0;

        if (playerType == PlayerType.MC) {
            this.isControllable = true;
            this.isDealer = false;
        } else {
            this.isControllable = false;
            this.isDealer = playerType == PlayerType.Dealer;
        }

        if (firstCard) {
            this.firstCard = firstCard;
            this.handCards.push(firstCard);
            this.isEmptyHand = false;
        } else {
            this.isEmptyHand = true;
            this.bet = 0;
        }
    }

    hit(card: Card) {
        if (this.isHandValid && !this.isBusted) {
            this.handCards.push(card);
            this.computeValue();
        } else {
            Notifier.error('Invalid Hand. Cannot hit');
        }

        return this;
    }

    buyInsurance() {
        this.insuredAmt = this.getBet() / 2;
        this.isInsured = true;
        return this;
    }

    doDoubleDown() {
        return this;
    }

    dealFirstCard(card: Card) {
        this.firstCard = card;
        this.handCards.push(card);
        this.isEmptyHand = false;
        this.isHandValid = false;
        this.isHandDone = false;

        return this;
    }

    dealSecondCard(card: Card) {
        this.secondCard = card;
        this.handCards.push(card);
        this.isHandValid = this.handCards.length >= 2 && this.bet > 0;
        this.isBusted = false;

        this.resetValue();
        this.computeValue();

        this.isBlackJack = this.handCards.length == 2 && this.value.indexOf(21) > -1;
        return this;
    }

    showDealerCard = () => {
        const card = this.getSecondCard()!;
        card.show();
        if (card.getKey() == 'A') {
            this.isDealerAceUp = true;
        } else {
            this.isDealerAceUp = false;
        }
        return this;
    };

    getDealerShowCard = () => {
        return this.getSecondCard()!;
    };

    getFirstCard = () => {
        return this.firstCard;
    };

    getSecondCard = () => {
        return this.secondCard;
    };

    getBet = () => {
        return this.bet;
    };

    getInsuredAmt = () => this.insuredAmt;

    getTotalCards = () => {
        return this.handCards.length;
    };

    setBet = (bet: number) => {
        //This only tests for bet can't be < 0, the min/max bet part will be handled via Player class
        this.bet = bet > 0 ? bet : 0;
        return this;
    };

    computeValue() {
        if (!this.isHandValid) {
            this.resetValue();
            Notifier.error('Invalid Hand. Cannot compute value');
            return;
        }

        let hasSoftValue: boolean = false;
        let valueList = this.handCards.map((c) => {
            const values = c.getValue();
            if (values.length == 2) {
                hasSoftValue = true;
            }
            return values;
        });

        let firstValue = valueList.reduce(
            (a: number[], b) => {
                return [a[0] + b[0]];
            },
            [0]
        );

        if (hasSoftValue) {
            let index = valueList.findIndex((v) => {
                return v.length == 2;
            });
            valueList[index] = [valueList[index][1]]; //only the first A needs to be 1 or 11
            let secondValue = valueList.reduce(
                (a: number[], b) => {
                    return [a[0] + b[0]];
                },
                [0]
            );

            this.value = [firstValue[0], secondValue[0]];
        } else {
            this.value = firstValue;
        }

        this.isBusted = this.value.every((v) => v > 21);
    }

    getValue() {
        return this.value.filter((v) => v <= 21);
    }

    getRawValue = () => {
        return this.value;
    };

    getHighestValue() {
        if (this.value.length == 1) {
            return this.value[0] > 21 ? 0 : this.value[0];
        } else {
            let validValues = this.value.filter((v) => v <= 21);
            if (validValues.length > 0) {
                return validValues.reduce((a, b) => {
                    return a > b ? a : b;
                }, 0);
            } else {
                return 0;
            }
        }
    }

    resetValue() {
        this.value = [0];
    }

    clearInsuranceFlags() {
        this.isEvenPay = false;
        this.isInsured = false;
        this.insuredAmt = 0;
    }

    stand() {
        this.isHandDone = true;
        return this;
    }

    split() {
        //need to run check first
        return [new Hand(this.firstCard), new Hand(this.secondCard as Card)];
    }

    surrender() {}
}

export default Hand;
