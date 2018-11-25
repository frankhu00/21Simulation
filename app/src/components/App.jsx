import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'

import Card, { SuitType } from '../js/Card'
import { Shoe, Deck } from '../js/CardCollections'
import CSManager, { HiLo, WongHalves, OmegaII } from '../js/CountingSystem'

import { CardView, CardListView } from './pages/main/index'

window.CSManager = CSManager;

const AppContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px;
`


class App extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <AppContainer>
                <CardView card={new Card('Q', SuitType.Hearts)}/>
                <CardListView cards={ new Deck({cards: 25}).get() }/>
                <CardListView cards={ new Shoe().get() }/>
            </AppContainer>
        )
    }
}

export default hot(module)(App)