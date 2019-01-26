import {showPanel} from "./panels/panels.js";
import {clipboardSupported} from "./clipboard.js";
import {on, ui} from "./dom.js";
import {plotter} from "./plotter.js";

// Make control panel visible by default on wide enough screens
if (window.innerWidth >= 980) {
    showPanel("collections");
}

// If Clipboard API is not supported, hide all copy controls
if (!clipboardSupported) {
    ui.get(".clipboard").forEach(el => {
        el.classList.add("hidden");
    });
}

// Repaint canvas on window resize
{
    let canvas = ui.get("canvas");
    let debounceTimer = null;
    let repaint = () => {
        debounceTimer = null;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        plotter.repaint();
    };

    on(window, "resize", () => {
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(repaint, 100);
    });

    repaint();
}
