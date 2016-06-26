import dom from "../dom.js";
import ls from "../ls.js";
import plotter from "../plotter.js";

let panel = dom.ui.get(".panels").get("settings");
let popup = dom.ui.get("letterPopup");
let rulesBlock = panel.querySelector(".ls-rules");

let ruleCtrl = {
    tpl: dom.ui.get("ruleTpl"),
    
    delete(letter) {
        if (ls.deleteRule(letter)) {
            let label = rulesBlock.querySelector(`[data-mark="${letter}"]`);
            let input = label.previousElementSibling.querySelector("input");
            input.focus();
            input.selectionStart = input.selectionEnd = input.value.length;
            label.parentNode.removeChild(label);
        }
    },

    insert(letter, beforeEl = ruleCtrl.tpl) {
        if (!letter) {
            return;
        }
        let html = ruleCtrl.tpl.innerHTML.replace(/\$\{letter\}/g, letter);
        beforeEl.insertAdjacentHTML("beforebegin", html);
        ls.setRule(letter, letter);
        let input = rulesBlock.querySelector(`input[data-letter="${letter}"]`);
        input.focus();
        input.select();
    },

    replace(oldLetter, newLetter) {
        if (ls.deleteRule(oldLetter)) {
            ls.setRule(newLetter, newLetter);
            let label = rulesBlock.querySelector(`[data-mark="${oldLetter}"]`);
            let input = rulesBlock.querySelector(`input[data-letter="${oldLetter}"]`);
            label.dataset.mark = newLetter;
            input.dataset.letter = newLetter;
            input.focus();
        }
    }
};

let handlers = {
    clickAddRule() {
        ruleCtrl.insert([...ls.vacantLetters][0]);
    },

    keyDownBackspace(e) {
        let target = e.target;
        let letter = target.dataset.letter;
        if (letter && !target.value) {
            ruleCtrl.delete(letter);
            e.preventDefault();
        }
    },

    keyDownDelete(e) {
        if (e.ctrlKey) {
            ruleCtrl.delete(e.target.dataset.letter);
        }
    },

    keyDownInsert(e) {
        let letter = e.target.dataset.letter;
        if (letter) {
            let beforeEl = (letter === "F")
                ? undefined
                : rulesBlock.querySelector(`[data-mark="${letter}"]`).nextElementSibling;
            ruleCtrl.insert([...ls.vacantLetters][0], beforeEl);
        }
    },
    
    clickRuleLetter(e) {
        let target = e.target;
        let letter = target.dataset.mark;
        if (letter && letter !== "F" && letter !== "B") {
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
                popup.dataset.ownerLetter = letter;
            }
        }
    },

    clickPopupBtn(e) {
        let newLetter = e.target.value;
        let oldLetter = popup.dataset.ownerLetter;
        if (newLetter) {
            ruleCtrl.replace(oldLetter, newLetter);
        } else {
            ruleCtrl.delete(oldLetter);
        }
        popup.classList.remove("visible");
    },

    clickPlot(e) {
        e.preventDefault();
        let ruleFields = [...rulesBlock.querySelectorAll("input[data-letter]")];
        let rules = new Map(ruleFields.map(field => [field.dataset.letter, field.value.toUpperCase()]));
        try {
            ls.reset();
            ls.axiom = dom.ui.get("axiom").value.toUpperCase();
            ls.alpha = -dom.ui.get("alpha").value * Math.PI / 180;
            ls.theta = dom.ui.get("theta").value * Math.PI / 180;
            ls.step = Number(dom.ui.get("step").value);
            ls.iterCount = Number(dom.ui.get("iterCount").value);
            ls.setRules(rules);
        } catch (ex) {
            alert(ex.message);
            return;
        }
        plotter.plot();
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
popup.addEventListener("click", handlers.clickPopupBtn);
dom.ui.get("plot").addEventListener("click", handlers.clickPlot);