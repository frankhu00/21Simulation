import 'mocha';
import { expect } from 'chai'
import sinon from 'sinon'

import Player , { PlayerType } from '../app/src/js/Player';
import GameController from '../app/src/js/GameController'

describe('GameController Tests', () => {

    let GID: string
    let GC: GameController

    beforeEach( () => {
        GID = 'GameTestID'
        GC = new GameController(GID)
    })

    it('Can register players', () => {
        let mcPlayer = new Player(PlayerType.MC)
        let registered = GC.register(mcPlayer)
        mcPlayer.getGameID()

        expect(registered).to.eql(true)
        expect(mcPlayer.getGameID()).to.eql(GID)
        expect(GC.totalPlayers).to.eql(1)
    })

    it('Can register multiple players', () => {
        let players = [
            new Player(PlayerType.MC),
            new Player(PlayerType.MC),
            new Player(PlayerType.NPC),
            new Player(PlayerType.NPC),
            new Player(PlayerType.NPC)
        ]
        let resultRegistered = players.map(p => GC.register(p))
        let shouldRegistered = Array(5).fill(true)

        let resultGID = players.map(p => p.getGameID())
        let shouldGID = Array(5).fill(GID)
        
        expect(resultRegistered).to.eql(shouldRegistered)
        expect(resultGID).to.eql(shouldGID)
        expect(GC.totalPlayers).to.eql(5)
    })

    it('Can have multiple players join', () => {
        let players = [
            new Player(PlayerType.MC),
            new Player(PlayerType.MC),
            new Player(PlayerType.NPC),
            new Player(PlayerType.NPC),
            new Player(PlayerType.NPC)
        ]
        let resultRegistered = players.map(p => p.join(GC))
        let shouldRegistered = Array(5).fill(true)

        let resultGID = players.map(p => p.getGameID())
        let shouldGID = Array(5).fill(GID)
        
        expect(resultRegistered).to.eql(shouldRegistered)
        expect(resultGID).to.eql(shouldGID)
    })

    it('Set newly joined player hand to 1', () => {      
        //WIP - need player change hand tests
        let p = new Player(PlayerType.MC)
        p.changeHandTo(3).join(GC)

        expect(p.numOfHands()).to.eql(1)
    })

});