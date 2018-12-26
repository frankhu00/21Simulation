import defaultRules, { PlayRuleOption } from './PlayRule'

class GameController {

    private rule: PlayRuleOption = defaultRules

    constructor(rule: PlayRuleOption = defaultRules) {
        this.rule = rule
    }

}

export default GameController