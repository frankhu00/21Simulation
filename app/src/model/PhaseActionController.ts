import { GameControlInterface } from './GameController';

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
            if (!player.decide()) {
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
        const playerFO = gc.getPlayerFlowOrder();
        playerFO.forEach((pfo) => {
            const player = pfo.player!;
            player.getHands().forEach((hand) => hand.dealFirstCard(gc.takeCard()));
        });
        gc.getDealer().getCurrentHand().dealFirstCard(gc.takeCard());

        playerFO.forEach((pfo) => {
            const player = pfo.player!;
            player.getHands().forEach((hand) => hand.dealSecondCard(gc.takeCard()));
        });
        gc.getDealer().getCurrentHand().dealSecondCard(gc.takeCard());
        gc.getDealer().getCurrentHand().getSecondCard()!.show();
        this.end(gc);
    };

    end = (gc: GameControlInterface) => {
        gc.onPhaseEnd();
    };
}

export class PlayPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.PLAY;

    action = (gc: GameControlInterface) => {};

    end = (gc: GameControlInterface) => {};
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
