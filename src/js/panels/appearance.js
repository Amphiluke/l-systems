import dom from "../dom.js";
import plotter from "../plotter.js";

let panel = dom.ui.get(".panels").get("appearance");
let mainArea = dom.ui.get("mainArea");

let appearanceCtrl = {
    setFg(color) {
        plotter.settings.strokeStyle = color;
        plotter.repaint();
    },

    setBg(color) {
        plotter.settings.fillStyle = document.body.style.background = color;
        plotter.repaint();
    },

    transforms: {
        rotate: {pattern: /\s*rotate\(.+?deg\)/, unit: "deg"},
        translateX: {pattern: /\s*translateX\(.+?px\)/, unit: "px"},
        translateY: {pattern: /\s*translateY\(.+?px\)/, unit: "px"},
        scale: {pattern: /\s*scale\(.+?\)/, unit: ""}
    },

    setTransform(transform, value) {
        let style = mainArea.style;
        let {pattern, unit} = appearanceCtrl.transforms[transform];
        let otherTransforms = style.transform.replace(pattern, "").trim();
        if (!value) {
            style.transform = otherTransforms;
        } else {
            style.transform = `${otherTransforms} ${transform}(${value}${unit})`.trim();
        }
    }
};

let handlers = {
    changeFg(e) {
        appearanceCtrl.setFg(e.target.value);
    },

    changeBg(e) {
        appearanceCtrl.setBg(e.target.value);
    },

    toggleTransparency(e) {
        let bgInput = dom.ui.get("bgClr");
        let transparent = bgInput.disabled = e.target.checked;
        appearanceCtrl.setBg(transparent ? "transparent" : bgInput.value);
    },

    changeTransform({target}) {
        let transform = target.dataset.transform;
        if (transform && target.validity.valid) {
            appearanceCtrl.setTransform(transform, target.value.trim());
        }
    }
};

dom.ui.get("fgClr").addEventListener("change", handlers.changeFg);
dom.ui.get("bgClr").addEventListener("change", handlers.changeBg);
dom.ui.get("noBgClr").addEventListener("change", handlers.toggleTransparency);

panel.addEventListener("change", handlers.changeTransform);