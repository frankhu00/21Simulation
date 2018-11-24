import React, { Component } from 'react'
import { hot } from 'react-hot-loader'

class App extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div>Electron + React + Webpack + Babel Setup Boilerplate</div>
        )
    }
}

export default hot(module)(App)