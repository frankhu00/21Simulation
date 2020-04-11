import { GameDelegatorInterface } from './GameDelegator';

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
    phaseEnded: boolean;
    action: (gc: GameDelegatorInterface) => PhaseControllerInterface;
    end: (gc: GameDelegatorInterface) => PhaseControllerInterface;
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
    public phaseEnded = false;

    action = (gc: GameDelegatorInterface) => {
        return this;
    };

    end = (gc: GameDelegatorInterface) => {
        return this;
    };
}

export class BetPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.BET;
    public phaseEnded = false;

    action = (gc: GameDelegatorInterface) => {
        return this;
    };

    end = (gc: GameDelegatorInterface) => {
        return this;
    };
}

export class DealPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.DEAL;
    public phaseEnded = false;

    action = (gc: GameDelegatorInterface) => {
        return this;
    };

    end = (gc: GameDelegatorInterface) => {
        return this;
    };
}

export class PlayPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.PLAY;
    public phaseEnded = false;

    action = (gc: GameDelegatorInterface) => {
        return this;
    };

    end = (gc: GameDelegatorInterface) => {
        return this;
    };
}

export class HousePhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.HOUSE;
    public phaseEnded = false;

    action = (gc: GameDelegatorInterface) => {
        return this;
    };

    end = (gc: GameDelegatorInterface) => {
        return this;
    };
}

export class CheckPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.CHECK;
    public phaseEnded = false;

    action = (gc: GameDelegatorInterface) => {
        return this;
    };

    end = (gc: GameDelegatorInterface) => {
        return this;
    };
}

export class PayoutPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.PAYOUT;
    public phaseEnded = false;

    action = (gc: GameDelegatorInterface) => {
        return this;
    };

    end = (gc: GameDelegatorInterface) => {
        return this;
    };
}

export class EndPhaseController implements PhaseControllerInterface {
    public phase = GameActionPhase.END;
    public phaseEnded = false;

    action = (gc: GameDelegatorInterface) => {
        return this;
    };

    end = (gc: GameDelegatorInterface) => {
        return this;
    };
}
