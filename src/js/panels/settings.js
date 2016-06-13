import dom from "../dom.js";
import ls from "../ls.js";

let ruleTpl = dom.ui.get("ruleTpl").innerHTML;
let panel = dom.ui.get(".panels").get("settings");
let rulesBlock = panel.querySelector(".ls-rules");

function deleteRule(letter) {
    if (!letter || letter === "F" || letter === "B") {
        return;
    }
    ls.deleteRule(letter);
    let label = rulesBlock.querySelector(`[data-mark="${letter}"]`);
    let input = label.previousElementSibling.querySelector("input");
    input.focus();
    input.selectionStart = input.selectionEnd = input.value.length;
    label.parentNode.removeChild(label);
}

function insertRule(letter, beforeEl = dom.ui.get("ruleTpl")) {
    if (!letter) {
        return;
    }
    let html = ruleTpl.replace(/\$\{letter\}/g, letter);
    beforeEl.insertAdjacentHTML("beforebegin", html);
    ls.setRule(letter, letter);
    let input = rulesBlock.querySelector(`input[data-letter="${letter}"]`);
    input.focus();
    input.select();
}

let handlers = {
    clickAddRule() {
        insertRule([...ls.vacantLetters][0]);
    },

    keyDownBackspace(e) {
        let target = e.target;
        let letter = target.dataset.letter;
        if (letter && !target.value) {
            deleteRule(letter);
            e.preventDefault();
        }
    },

    keyDownDelete(e) {
        if (e.ctrlKey) {
            deleteRule(e.target.dataset.letter);
        }
    },

    keyDownInsert(e) {
        let letter = e.target.dataset.letter;
        if (letter) {
            let beforeEl = (letter === "F")
                ? undefined
                : rulesBlock.querySelector(`[data-mark="${letter}"]`).nextElementSibling;
            insertRule([...ls.vacantLetters][0], beforeEl);
        }
    },
    
    clickRuleLetter(e) {
        let target = e.target;
        let letter = target.dataset.mark;
        if (letter && letter !== "F" && letter !== "B") {
            let popup = dom.ui.get("letterPopup");
            if (!popup.classList.contains("visible")) {
                let vacant = ls.vacantLetters;
                [...popup.getElementsByTagName("button")].forEach(btn => {
                    btn.disabled = btn.value && !vacant.has(btn.value);
                });
            }
            popup.classList.toggle("visible");
            if (popup.classList.contains("visible")) {
                popup.style.left = `${target.offsetLeft}px`;
                popup.style.top = `${target.offsetTop + target.offsetHeight}px`;
            }
        }
    },

    clickPlot(e) {
        e.preventDefault();
        let ruleFields = [...rulesBlock.querySelectorAll("input[data-letter]")];
        let rules = new Map(ruleFields.map(field => [field.value.toUpperCase(), field.dataset.letter]));
        try {
            ls.reset();
            ls.axiom = dom.ui.get("axiom").value.toUpperCase();
            ls.alpha = Number(dom.ui.get("alpha").value);
            ls.theta = Number(dom.ui.get("theta").value);
            ls.step = Number(dom.ui.get("step").value);
            ls.iterCount = Number(dom.ui.get("iterCount").value);
            ls.setRules(rules);
        } catch (ex) {
            alert(ex.message);
            return;
        }
        // draw...
    }
};

dom.ui.get("addRule").addEventListener("click", handlers.clickAddRule);

rulesBlock.addEventListener("keydown", e => {
    let method = `keyDown${e.key}`;
    if (handlers.hasOwnProperty(method)) {
        handlers[method](e);
    }
});

rulesBlock.addEventListener("click", handlers.clickRuleLetter);

dom.ui.get("plot").addEventListener("click", handlers.clickPlot);