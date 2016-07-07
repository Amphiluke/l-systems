import dom from "../dom.js";
import ls from "../ls.js";
import channel from "../channel.js";
import plotter from "../plotter.js";

let panel = dom.ui.get(".panels").get("exporting"),
    exportLink = dom.ui.get("exportImg"),
    canvas = dom.ui.get("canvas");

let exportCtrl = {
    makeImgLink(mimeType = "image/png") {
        URL.revokeObjectURL(exportLink.href);
        canvas.toBlob(blob => {
            let ext = mimeType.slice(mimeType.lastIndexOf("/") + 1);
            exportLink.href = URL.createObjectURL(blob);
            exportLink.download = `l-system.${ext}`;
            exportLink.innerHTML = `Download ${ext.toUpperCase()}…`;
            panel.classList.add("ls-export-requested");
        }, mimeType);
    },

    unmakeImgLink() {
        panel.classList.remove("ls-export-requested");
    },

    getLSystemLink() {
        let link = `${location.origin}${location.pathname}?~ls~=`;
        link += `ax${encodeURIComponent(ls.axiom)}~`;
        for (let [letter, rule] of ls.rules) {
            link += `r${letter}${encodeURIComponent(rule)}~`;
        }
        link += `al${(-ls.alpha * 180 / Math.PI).toFixed(3)}~`;
        link += `th${(ls.theta * 180 / Math.PI).toFixed(3)}~`;
        link += `it${ls.iterCount}~`;
        link += `st${ls.step}`;
        return link;
    },

    checkURLQuery() {
        let match = location.search.match(/(?:\?|&)~ls~=([^&]+)/);
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
                    ls.alpha = -value * Math.PI / 180;
                    break;
                case "th":
                    ls.theta = value * Math.PI / 180;
                    break;
                case "it":
                    ls.iterCount = +value;
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
    clickExportControl(e) {
        let target = e.target;
        if (target === exportLink) {
            exportCtrl.unmakeImgLink();
        } else if (target.dataset.mimeType) {
            exportCtrl.makeImgLink(target.dataset.mimeType);
        }
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

panel.querySelector(".ls-export-controls").addEventListener("click", handlers.clickExportControl);
dom.ui.get("makeLink").addEventListener("click", handlers.clickMakeLink);
dom.ui.get("linkAddress").addEventListener("focus", handlers.focusLinkAddress);

exportCtrl.checkURLQuery();