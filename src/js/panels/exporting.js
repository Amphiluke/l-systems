import dom from "../dom.js";
import ls from "../ls.js";
import channel from "../channel.js";
import plotter from "../plotter.js";

let exportCtrl = {
    getLSystemLink() {
        let link = `${location.origin}${location.pathname}?~ls~=`;
        link += `ax${encodeURIComponent(ls.axiom)}~`;
        for (let [letter, rule] of ls.rules) {
            link += `r${letter}${encodeURIComponent(rule)}~`;
        }
        link += `al${(ls.alpha * 180 / Math.PI).toFixed(3)}~`;
        link += `th${(ls.theta * 180 / Math.PI).toFixed(3)}~`;
        link += `it${ls.iterations}~`;
        link += `st${ls.step}`;
        return link;
    },

    checkURLQuery() {
        let match = location.search.match(/[?&]~ls~=([^&]+)/);
        if (!match) {
            return;
        }
        ls.reset();
        for (let param of match[1].split("~")) {
            let key = param.slice(0, 2);
            let value = decodeURIComponent(param.slice(2));
            switch (key) {
                case "ax":
                    ls.axiom = value;
                    break;
                case "al":
                    ls.alpha = value * Math.PI / 180;
                    break;
                case "th":
                    ls.theta = value * Math.PI / 180;
                    break;
                case "it":
                    ls.iterations = +value;
                    break;
                case "st":
                    ls.step = +value;
                    break;
                default:
                    if (key[0] === "r") {
                        ls.setRule(value, key[1]);
                    }
                    break;
            }
        }
        channel.publish("LSystemConfigured");
        plotter.plot();
    }
};

let handlers = {
    mouseDownExport({target}) {
        URL.revokeObjectURL(target.href);
        let blob = new Blob([dom.ui.get("svg").outerHTML], {type: "image/svg+xml"});
        target.href = URL.createObjectURL(blob);
    },

    clickMakeLink() {
        let linkField = dom.ui.get("linkAddress");
        linkField.value = exportCtrl.getLSystemLink();
        linkField.focus();
        linkField.select();
    },

    focusLinkAddress(e) {
        e.target.select();
    }
};

dom.ui.get("exportImg").addEventListener("mousedown", handlers.mouseDownExport);
dom.ui.get("makeLink").addEventListener("click", handlers.clickMakeLink);
dom.ui.get("linkAddress").addEventListener("focus", handlers.focusLinkAddress);

exportCtrl.checkURLQuery();
