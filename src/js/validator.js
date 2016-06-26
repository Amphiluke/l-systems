let ruleRE = /^[A-Z\+\-\[\]]*$/;

let validator = {
    messages: {
        AXIOM: "The axiom may contain only the following characters: “A”-Z”, “+”, “-”, “[”, “]”",
        RULE: "Production rules may may contain only the following characters: “A”-Z”, “+”, “-”, “[”, “]”",
        LETTER: "The allowed alphabet letters are: “A”-“Z”",
        ALPHA: "The “alpha” parameter must be a finite number",
        THETA: "The “theta” parameter must be a finite number",
        STEP: "The “step” parameter must be a positive finite number",
        COUNT: "The number of iterations must be integer and finite",
        NUMBER: "A valid finite number expected"
    },

    checkRule(rule, msg = validator.messages.RULE) {
        return ruleRE.test(rule) || msg;
    },

    checkLetter(letter, msg = validator.messages.LETTER) {
        return ((letter.length === 1) && (letter >= "A") && (letter <= "Z")) || msg;
    },

    checkStep(step, msg = validator.messages.STEP) {
        return (Number.isFinite(step) && step > 0) || msg;
    },

    checkCount(count, msg = validator.messages.COUNT) {
        return (Number.isInteger(count) && count > 0) || msg;
    },

    checkNumber(number, msg = validator.messages.NUMBER) {
        return Number.isFinite(number) || msg;
    }
};

export default validator;