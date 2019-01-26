import {bankData} from "../bank.js";
import {ui, on} from "../dom.js";
import {ls} from "../ls.js";
import {publish} from "../channel.js";
import {plotter} from "../plotter.js";
import {copy} from "../clipboard.js";

let panel = ui.get("exporting.panels");
let exportLink = ui.get("exportImg");
let canvas = ui.get("canvas");

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
        let query = location.search;
        if (/[?&]~ls~=([^&]+)/.exec(query)) {
            this.setupByParams(RegExp.$1);
        } else if (/[?&]ls=([^&]+)/.exec(query)) {
            this.setupByName(RegExp.$1);
        }
    },

    setupByParams(query) {
        ls.reset();
        for (let param of query.split("~")) {
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
        publish("LSystemConfigured");
        plotter.plot();
    },

    setupByName(query) {
        let [collectionName, lSystemName] = decodeURIComponent(query).split("#");
        if (!bankData.hasOwnProperty(collectionName) || !bankData[collectionName].hasOwnProperty(lSystemName)) {
            return;
        }
        let params = bankData[collectionName][lSystemName];
        ls.reset();
        ls.axiom = params.axiom;
        ls.alpha = -params.alpha * Math.PI / 180;
        ls.theta = params.theta * Math.PI / 180;
        ls.step = params.step;
        ls.iterCount = params.iterCount;
        ls.setRules(new Map(Object.entries(params.rules)));
        publish("LSystemConfigured");
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
        let linkField = ui.get("linkAddress");
        linkField.value = exportCtrl.getLSystemLink();
        linkField.focus();
        linkField.select();
        ui.get("link.clipboard").disabled = false;
    },

    focusLinkAddress(e) {
        e.target.select();
    },

    clickCopy() {
        copy(ui.get("linkAddress").value);
    }
};

on(panel.querySelector(".ls-export-controls"), "click", handlers.clickExportControl);
on("makeLink", "click", handlers.clickMakeLink);
on("linkAddress", "focus", handlers.focusLinkAddress);
on(ui.get("link.clipboard"), "click", handlers.clickCopy);

exportCtrl.checkURLQuery();