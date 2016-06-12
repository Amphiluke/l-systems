import dom from "../dom.js";
import ls from "../ls.js";

let ruleTpl = dom.ui.get("ruleTpl").innerHTML;
let panel = dom.ui.get(".panels").get("settings");
let rulesBlock = panel.querySelector(".ls-rules");

function getRuleLetter(el) {
    let lsId = el.dataset.lsId;
    return (lsId && lsId.match(/^rule([A-Z])$/)) ? RegExp.$1 : undefined;
}

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
    let input = dom.getElementByLSID(`rule${letter}`, rulesBlock);
    input.focus();
    input.select();
}

let handlers = {
    clickAddRule() {
        insertRule([...ls.vacantLetters][0]);
    },

    keyDownBackspace(e) {
        let target = e.target;
        let letter = getRuleLetter(target);
        if (!target.value) {
            deleteRule(letter);
            e.preventDefault();
        }
    },

    keyDownDelete(e) {
        if (e.ctrlKey) {
            deleteRule(getRuleLetter(e.target));
        }
    },

    keyDownInsert(e) {
        let letter = getRuleLetter(e.target);
        if (!letter) {
            return;
        }
        let beforeEl = (letter === "F" || letter === "B")
            ? undefined
            : rulesBlock.querySelector(`[data-mark="${letter}"]`).nextElementSibling;
        insertRule([...ls.vacantLetters][0], beforeEl);
    }
};

dom.ui.get("addRule").addEventListener("click", handlers.clickAddRule);

rulesBlock.addEventListener("keydown", e => {
    let key = e.key;
    if (handlers.hasOwnProperty(`keyDown${key}`)) {
        handlers[`keyDown${key}`](e);
    }
});