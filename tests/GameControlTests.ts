import 'mocha';
import { expect } from 'chai'

import Player , { PlayerType } from '../app/src/js/Player';
import GameController from '../app/src/js/GameController'
import defaultConfig, { GameConfiguration } from '../app/src/js/GameConfig'
import defaultRules from '../app/src/js/PlayRule'


describe('GameController Tests', () => {

    let GID: string
    let GC: GameController

    let fourPlayerConfig : GameConfiguration
    let maxFourGC: GameController

    beforeEach( () => {
        GID = 'GameTestID'
        GC = new GameController(GID)

        fourPlayerConfig = Object.assign({}, defaultConfig, {tableMaxHands: 4})
        maxFourGC = new GameController('max 4 players/hands', defaultRules, fourPlayerConfig)
    })

    it('Can register players', () => {
        let mcPlayer = new Player(PlayerType.MC)
        let registered = GC.register(mcPlayer)
        mcPlayer.getGameID()

        expect(registered).to.eql(true)
        expect(mcPlayer.getGameID()).to.eql(GID)
        expect(GC.getTotalPlayers()).to.eql(1)
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
        expect(GC.getTotalPlayers()).to.eql(5)
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

    it('Can properly limit player size to 4 hands (1 hand per player)', () => {

        let p = new Player(PlayerType.MC)
        let a1 = new Player(PlayerType.NPC)
        let a2 = new Player(PlayerType.NPC)
        let a3 = new Player(PlayerType.NPC)
        let a4 = new Player(PlayerType.NPC)

        p.join(maxFourGC)
        a1.join(maxFourGC)
        a2.join(maxFourGC)
        a3.join(maxFourGC)

        //This should fail to join
        let didFifthPlayerJoin = a4.join(maxFourGC)
        expect(didFifthPlayerJoin).to.eqls(false)
        expect(maxFourGC.getTotalPlayers()).to.eqls(4)
    })

    it('Can properly limit player size to 4 hands (1 player with 4 hands)', () => {

        let p = new Player(PlayerType.MC)
        let ai = new Player(PlayerType.NPC)
        
        p.join(maxFourGC)
        p.changeHandTo(4) //need to execute after joining (first join forces hands to be 1)

        let didJoin = ai.join(maxFourGC)

        //This should fail to join
        expect(didJoin).to.eqls(false)
        expect(maxFourGC.getTotalPlayers()).to.eqls(1)
        expect(maxFourGC.getTotalHands()).to.eqls(4)
    })

    it('Can properly limit player size to 4 hands (3 hands for mc player, 1 for ai)', () => {

        let p = new Player(PlayerType.MC)
        let a1 = new Player(PlayerType.NPC)
        let a2 = new Player(PlayerType.NPC)
        
        p.join(maxFourGC)
        p.changeHandTo(3) //need to execute after joining (first join forces hands to be 1)
        a1.join(maxFourGC)
        a1.changeHandTo(1) //need to execute after joining (first join forces hands to be 1)

        let didJoin = a2.join(maxFourGC)

        //This should fail to join
        expect(didJoin).to.eqls(false)
        expect(maxFourGC.getTotalPlayers()).to.eqls(2)
        expect(maxFourGC.getTotalHands()).to.eqls(4)
    })

    it('Does change each player number of hands to 1 on join', () => {      
        //WIP - need player change hand tests
        let p = new Player(PlayerType.MC)
        p.join(GC)

        expect(p.numOfHands()).to.eql(1)
    })

    it('Can properly process change hand commands from player', () => {

        let p = new Player(PlayerType.MC)
        let a1 = new Player(PlayerType.NPC)

        p.join(maxFourGC)
        p.changeHandTo(3).changeHandTo(2)
        a1.join(maxFourGC)
        a1.changeHandTo(2) 

        expect(maxFourGC.players[0].numOfHands()).to.eqls(2) //for player p
        expect(maxFourGC.players[1].numOfHands()).to.eqls(2) //for player a1
    })

    it('Can prevent invalid change hand commands from player (max)', () => {

        let p = new Player(PlayerType.MC)
        let a1 = new Player(PlayerType.NPC)

        p.join(maxFourGC)
        p.changeHandTo(3)
        a1.join(maxFourGC)
        a1.changeHandTo(2) //should be invalid so numOfHands should still be 1

        expect(maxFourGC.players[0].numOfHands()).to.eqls(3) //for player p
        expect(maxFourGC.players[1].numOfHands()).to.eqls(1) //for player a1
    })

    it('Can prevent invalid change hand commands from player (min of 1)', () => {

        let p = new Player(PlayerType.MC)
        let a1 = new Player(PlayerType.NPC)

        p.join(maxFourGC)
        p.changeHandTo(3).changeHandTo(-1)
        a1.join(maxFourGC)
        a1.changeHandTo(0) //should be invalid so numOfHands should still be 1

        expect(maxFourGC.players[0].numOfHands()).to.eqls(3) //for player p
        expect(maxFourGC.players[1].numOfHands()).to.eqls(1) //for player a1
    })

});