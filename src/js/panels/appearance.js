import dom from "../dom.js";
import plotter from "../plotter.js";

let canvas = dom.ui.get("canvas");

let handlers = {
    changeFG(e) {
        plotter.settings.strokeStyle = e.target.value;
        plotter.repaint();
    },

    changeBG(e) {
        plotter.settings.fillStyle = document.body.style.background = e.target.value;
        plotter.repaint();
    },

    changePhi(e) {
        let style = canvas.style;
        let otherTransforms = style.transform.replace(/\s*rotate\(.+?deg\)/, "").trim();
        let value = e.target.value;
        if (!value) {
            style.transform = otherTransforms;
        } else if (e.target.validity.valid) {
            style.transform = `${otherTransforms} rotate(${value}deg)`.trim();
        }
    },

    changeX(e) {
        let style = canvas.style;
        let otherTransforms = style.transform.replace(/\s*translateX\(.+?px\)/, "").trim();
        let value = e.target.value;
        if (!value) {
            style.transform = otherTransforms;
        } else if (e.target.validity.valid) {
            style.transform = `${otherTransforms} translateX(${value}px)`.trim();
        }
    },

    changeY(e) {
        let style = canvas.style;
        let otherTransforms = style.transform.replace(/\s*translateY\(.+?px\)/, "").trim();
        let value = e.target.value;
        if (!value) {
            style.transform = otherTransforms;
        } else if (e.target.validity.valid) {
            style.transform = `${otherTransforms} translateY(${value}px)`.trim();
        }
    },

    changeScaling(e) {
        let style = canvas.style;
        let otherTransforms = style.transform.replace(/\s*scale\(.+?\)/, "").trim();
        let value = e.target.value;
        if (!value) {
            style.transform = otherTransforms;
        } else if (e.target.validity.valid) {
            style.transform = `${otherTransforms} scale(${value})`.trim();
        }
    }
};

dom.ui.get("fgClr").addEventListener("change", handlers.changeFG);
dom.ui.get("bgClr").addEventListener("change", handlers.changeBG);

dom.ui.get("phiRotation").addEventListener("change", handlers.changePhi);
dom.ui.get("xTranslation").addEventListener("change", handlers.changeX);
dom.ui.get("yTranslation").addEventListener("change", handlers.changeY);
dom.ui.get("scaling").addEventListener("change", handlers.changeScaling);