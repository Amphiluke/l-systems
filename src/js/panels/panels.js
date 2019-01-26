import {ui, on} from "../dom.js";
import {subscribe} from "../channel.js";
import "./collections.js";
import "./settings.js";
import "./appearance.js";
import "./exporting.js";

let openedPanel = [...ui.get(".panels").values()]
    .find(el => el.classList.contains("ls-panel-open"));

export function showPanel(panelId, allowToggle = false) {
    let panel = ui.get(`${panelId}.panels`);
    if (!panel) {
        return;
    }
    if (panel !== openedPanel) {
        if (openedPanel) {
            openedPanel.classList.remove("ls-panel-open");
        }
        panel.classList.add("ls-panel-open");
        openedPanel = panel;
    } else if (allowToggle) {
        hidePanel();
    }
}

export function hidePanel() {
    if (openedPanel) {
        openedPanel.classList.remove("ls-panel-open");
        openedPanel = null;
    }
}

on("tabs", "click", e => {
    let ref = e.target.dataset.lsRef;
    if (ref) {
        showPanel(ref, true);
    }
});

subscribe("LSystemConfigured", () => {
    showPanel("settings");
});
