import { GameControlInterface } from './GameController';
import Notifier from './Notifier';
import { PlayerInterface } from './Player';

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

export interface PhaseControllerInterface {
    phase: GameActionPhase;
    action: (gc: GameControlInterface) => void;
    end: (gc: GameControlInterface) => void;
}

export class PhaseActionController {
    public controller: PhaseControllerInterface;

    constructor(phase: GameActionPhase) {
        this.controller = this.load(phase);
    }

    load: (phase: GameActionPhase) => PhaseControllerInterface = (phase) => {
        switch (phase) {
            case GameActionPhase.START:
                return new StartPhaseController();
            case GameActionPhase.BET:
                return new BetPhaseController();
            case GameActionPhase.DEAL:
                return new DealPhaseController();
            case GameActionPhase.PLAY:
                return new PlayPhaseController();
            case GameActionPhase.HOUSE:
                return new HousePhaseController();
            case GameActionPhase.CHECK:
                return new CheckPhaseController();
            case GameActionPhase.PAYOUT:
                return new PayoutPhaseController();
            case GameActionPhase.END:
                return new EndPhaseController();
            default:
                throw new Error('Phase not found!');
        }
    };

    get: () => PhaseControllerInterface = () => this.controller;
}

export class StartPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.START;

    action = (gc: GameControlInterface) => {
        this.end(gc);
    };

    end = (gc: GameControlInterface) => {
        gc.onPhaseEnd();
    };
}

export class BetPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.BET;

    action = (gc: GameControlInterface) => {
        const playerFO = gc.getPlayerFlowOrder();
        playerFO.forEach((pfo) => {
            const player = pfo.player!;
            if (!player.decideBet()) {
                player.changeHandTo(0);
                return;
            }

            //auto bet min amt and 1 hand for now
            player.bet(gc.getRules().minBet, 1);
        });
        this.end(gc);
    };

    end = (gc: GameControlInterface) => {
        gc.onPhaseEnd();
    };
}

export class DealPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.DEAL;

    action = (gc: GameControlInterface) => {
        const flowOrder = gc.getPlayerFlowOrder();
        flowOrder.forEach((fo) => {
            const player = fo.player!;
            //this is here since need to call gc.takeCard fn... this maybe should be in game delegator..?
            //there already is the deal() fn in the delegator, so can refactor this
            player.resetHandOrder();
            player.getCurrentHand().dealFirstCard(gc.takeCard());
            while (player.hasNextHand()) {
                player.toNextHand().getCurrentHand().dealFirstCard(gc.takeCard());
            }
        });
        gc.getDealer().getCurrentHand().dealFirstCard(gc.takeCard());

        flowOrder.forEach((fo) => {
            const player = fo.player!;
            player.resetHandOrder();
            player.getCurrentHand().dealSecondCard(gc.takeCard());
            while (player.hasNextHand()) {
                player.toNextHand().getCurrentHand().dealSecondCard(gc.takeCard());
            }
        });
        gc.getDealer().getCurrentHand().dealSecondCard(gc.takeCard()).showDealerCard();
        //POST MVP - maybe allow config to show 1st or 2nd card to see if theres any difference
        this.end(gc);
    };

    end = (gc: GameControlInterface) => {
        gc.onPhaseEnd();
    };
}

export class PlayPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.PLAY;

    action = (gc: GameControlInterface) => {
        const flowOrder = gc.getPlayerFlowOrder();
        const dealerHand = gc.getDealer().getCurrentHand();
        //Insurance check needs to be first, since BJ will trigger as along as dealer has 21
        //but if dealer face up is A, then it is insurance play flow and not dealer BJ play flow
        if (dealerHand.isDealerAceUp) {
            //set game flag for hadInsurance (affects payout phase)
            gc.hadInsurance = true;

            //ask each player's hand for insurance
            flowOrder.forEach((fo) => {
                fo.player!.takeInsuranceAction();
            });
            //check insurance result

            if (dealerHand.isBlackJack) {
                //sets insurance payout modifiers and then move to next phase
                flowOrder.forEach((fo) => {
                    fo.player!.setDealerInsuranceBJPayoutModifier();
                });

                Notifier.notify('Insurance: Dealer Black Jack!');
                this.end(gc);
            } else {
                //collect all insurance and continue as normal
                flowOrder.forEach((fo) => {
                    fo.player!.setLooseInsurancePayoutModifier();
                });

                this.normalFlowAction(gc);
            }
        } else if (dealerHand.isBlackJack) {
            //call end
            Notifier.notify('Dealer Black Jack!');
            this.end(gc);
        } else {
            //Regular play flow
            this.normalFlowAction(gc);
        }
    };

    end = (gc: GameControlInterface) => {
        gc.onPhaseEnd();
    };

    normalFlowAction = (gc: GameControlInterface) => {
        const flowOrder = gc.getPlayerFlowOrder();
        flowOrder.forEach((fo) => {
            const player = fo.player!;
            //Not sure if this will have async issues
            player.playAction(gc.getDealer().getShowCard());
        });
    };
}

export class HousePhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.HOUSE;

    action = (gc: GameControlInterface) => {};

    end = (gc: GameControlInterface) => {};
}

export class CheckPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.CHECK;

    action = (gc: GameControlInterface) => {};

    end = (gc: GameControlInterface) => {};
}

export class PayoutPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.PAYOUT;

    action = (gc: GameControlInterface) => {};

    end = (gc: GameControlInterface) => {};
}

export class EndPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.END;

    action = (gc: GameControlInterface) => {};

    end = (gc: GameControlInterface) => {};
}
