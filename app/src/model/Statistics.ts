import Notifier from "./Notifier";

export interface Tracker {
    track: (category: string, event: string, value: any) => Tracker
    get: () => TrackerStats
}

export interface TrackerTableStats {
    totalNumberOfRounds: number,
    finalRC: number,
    highestRC: number,
    lowestRC: number,
    cardsToPenetration: number
}

export interface TrackerPlayerStats {
    totalBlackJacks: number,
    totalInsurance: number,
    totalCorrectInsurance: number,
    totalDoubleDown: number,
    finalPlayerRC: number,
    highestBet: number,
    lowestBet: number,
    highestTotalBet: number,
    lowestTotalBet: number,
    highestHands: number,
    lowestHands: number
}

export interface StringTMap<T> { [key: string]: T }

export interface TrackerStats extends StringTMap<any> {
    table: TrackerTableStats,
    player: TrackerPlayerStats
}

class Statistics implements Tracker {

    private stats: TrackerStats = {
        table: {
            totalNumberOfRounds: 0,
            finalRC: 0, //this takes the burned card into account
            highestRC: 0,
            lowestRC: 0,
            cardsToPenetration: 0
        },
        player: {
            totalBlackJacks: 0,
            totalInsurance: 0,
            totalCorrectInsurance: 0,
            totalDoubleDown: 0,
            finalPlayerRC: 0, //from player perspective (unknown burned card count)
            highestBet: 0, //per hand
            lowestBet: 0,
            highestTotalBet: 0,
            lowestTotalBet: 0,
            highestHands: 0,
            lowestHands: 0
        }
    }
    
    track = (category: string, event: string, value: any) => {
        
        let currentValue: any = this.get()[category][event]
        if (typeof currentValue == 'undefined' || typeof currentValue == 'boolean' || typeof currentValue == 'string') {
            this.get()[category][event] = value
        }
        else if (typeof currentValue == 'number') {
            this.get()[category][event] += value
        }
        else if (typeof currentValue == 'object' && !Array.isArray(currentValue)) {
            this.get()[category][event] = Object.assign({}, currentValue, value)
        }
        else if (Array.isArray(currentValue)) {
            currentValue.concat(value)
        }
        else {
            Notifier.warn(`Tracking of ${category} ${event} with value: ${value} has failed!`)
        }
        return this
    }

    get = () => this.stats
}

export { Statistics }
export default new Statistics()