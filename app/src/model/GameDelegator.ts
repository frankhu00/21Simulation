import { PlayerInterface, PlayerType } from './Player';
import { PlayingHand } from './Hand';
import Card from './Card';
import { GameControlInterface } from './GameController';
import Notifier from './Notifier';

export interface GameDelegatorInterface {
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
class GameDelegator implements GameDelegatorInterface {
    private controller: GameControlInterface;
    constructor(controller: GameControlInterface) {
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
                    Notifier.warn(`Position ${pos} is already occupied!`);
                    return false;
                }
            } else {
                Notifier.warn('There are no more open positions!');
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

export default GameDelegator;
