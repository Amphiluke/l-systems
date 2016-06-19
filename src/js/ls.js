import validator from "./validator.js";

const ctrlRuleList = [["F", "F"], ["B", "B"], ["+", "+"], ["-", "-"], ["[", "["], ["]", "]"]];

const defaults = {
    alpha: 0,
    theta: 0,
    step: 10,
    iterCount: 3
};

let axiom, rules, settings;

let ls = {
    // The initial code (an axiom)
    get axiom() {
        return axiom;
    },
    set axiom(value) {
        let status = validator.checkRule(value, validator.messages.AXIOM);
        if (status === true) {
            axiom = value;
        } else {
            throw new Error(status);
        }
    },

    // Initial angle in radians
    get alpha() {
        return settings.alpha;
    },
    set alpha(value) {
        let status = validator.checkNumber(value, validator.messages.ALPHA);
        if (status === true) {
            settings.alpha = value;
        } else {
            throw new Error(status);
        }
    },

    // Angle increment in radians
    get theta() {
        return settings.theta;
    },
    set theta(value) {
        let status = validator.checkNumber(value, validator.messages.THETA);
        if (status === true) {
            settings.theta = value;
        } else {
            throw new Error(status);
        }
    },

    // The length of a “turtle” step in px
    get step() {
        return settings.step;
    },
    set step(value) {
        let status = validator.checkStep(value);
        if (status === true) {
            settings.step = value;
        } else {
            throw new Error(status);
        }
    },

    // Total number of iterations used to generate the resulting L-system code
    get iterCount() {
        return settings.iterCount;
    },
    set iterCount(value) {
        let status = validator.checkCount(value);
        if (status === true) {
            settings.iterCount = value;
        } else {
            throw new Error(status);
        }
    },

    // Productions for each symbol in the axiom
    get rules() {
        return new Map([...rules]);
    },
    setRule(production, letter) {
        let status = validator.checkLetter(letter);
        if (status !== true) {
            throw new Error(status);
        }
        status = validator.checkRule(production);
        if (status !== true) {
            throw new Error(status);
        }
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
        let vacant = new Set();
        for (let letter of letters) {
            if (!rules.has(letter)) {
                vacant.add(letter);
            }
        }
        return vacant;
    },

    getCode() {
        let code = settings.axiom;
        for (let count = settings.iterCount; count > 0; count--) {
            let newCode = "";
            for (let letter of code) {
                newCode += rules[letter] || "";
            }
            code = newCode;
        }
        return code;
    },

    reset() {
        axiom = "";
        settings = Object.assign({}, defaults);
        rules = new Map(ctrlRuleList);
    }
};

ls.reset();

export default ls;