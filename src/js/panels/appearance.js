import dom from "../dom.js";
import plotter from "../plotter.js";

let handlers = {
    changeFg(e) {
        plotter.setFGColor(e.target.value);
    },

    changeBg(e) {
        plotter.setBGColor(e.target.value);
    },

    toggleTransparency(e) {
        let bgInput = dom.ui.get("bgClr");
        let transparent = bgInput.disabled = e.target.checked;
        plotter.setBGColor(transparent ? "transparent" : bgInput.value);
    }
};

dom.ui.get("fgClr").addEventListener("change", handlers.changeFg);
dom.ui.get("bgClr").addEventListener("change", handlers.changeBg);
dom.ui.get("noBgClr").addEventListener("change", handlers.toggleTransparency);
