const ctrlRuleList = [["F", ""], ["B", ""], ["+", "+"], ["-", "-"], ["[", "["], ["]", "]"]];

const defaults = {
    axiom: "", // The initial code (an axiom)
    alpha: 0, // Initial angle in radians
    theta: 0, // Angle increment in radians
    step: 10, // The length of a “turtle” step in px
    iterations: 3 // Total number of iterations used to generate the resulting L-system code
};

let rules;

let ls = {
    // Productions for each symbol in the axiom
    get rules() {
        let ruleList = [...rules].filter(([key]) => key >= "A" && key <= "Z");
        return new Map(ruleList);
    },
    setRule(production, letter) {
        rules.set(letter, production);
    },
    setRules(productions) {
        productions.forEach(this.setRule, this);
    },
    deleteRule(letter) {
        if (letter !== "F" && letter !== "B" && rules.has(letter)) {
            rules.delete(letter);
            return true;
        }
        return false;
    },

    get vacantLetters() {
        let letters = "ACDEGHIJKLMNOPQRSTUVWXYZ";
        return new Set([...letters].filter(letter => !rules.has(letter)));
    },

    reset() {
        Object.assign(this, defaults);
        rules = new Map(ctrlRuleList);
    }
};

ls.reset();

export default ls;
