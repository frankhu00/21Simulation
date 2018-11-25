import React, { Component } from 'react'
import styled from 'styled-components'

import CardView from './CardView'
import Card from '../../../js/Card'

const CardContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
`

interface CardListViewProps {
    cards: Card[];
}

export default class CardListView extends Component<CardListViewProps, null> {
    render() {
        let { cards } = this.props
        return (
            <CardContainer>
                {
                    cards.map( (c, index) => <CardView key={index} card={c} />)
                }
            </CardContainer>
        )
    }
}