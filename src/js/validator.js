export let messages = {
    AXIOM: "The axiom may contain only the following characters: “A”-Z”, “+”, “-”, “[”, “]”",
    RULE: "Production rules may may contain only the following characters: “A”-Z”, “+”, “-”, “[”, “]”",
    LETTER: "The allowed alphabet letters are: “A”-“Z”",
    ALPHA: "The “alpha” parameter must be a finite number",
    THETA: "The “theta” parameter must be a finite number",
    STEP: "The “step” parameter must be a positive finite number",
    COUNT: "The number of iterations must be integer and finite",
    NUMBER: "A valid finite number expected"
};

let ruleRE = /^[A-Z+\-[\]]*$/;

export function checkRule(rule, msg = messages.RULE) {
    return ruleRE.test(rule) || msg;
}

let letterRE = /^[A-Z]$/;

export function checkLetter(letter, msg = messages.LETTER) {
    return letterRE.test(letter) || msg;
}

export function checkStep(step, msg = messages.STEP) {
    return (Number.isFinite(step) && step > 0) || msg;
}

export function checkCount(count, msg = messages.COUNT) {
    return (Number.isInteger(count) && count > 0) || msg;
}

export function checkNumber(number, msg = messages.NUMBER) {
    return Number.isFinite(number) || msg;
}
