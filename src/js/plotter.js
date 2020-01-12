// import {getSVGData} from "../../node_modules/lindsvg/dist/lindsvg.esm.js"; // use in dev mode
import {getSVGData} from "lindsvg"; // use for build

import ls from "./ls.js";
import dom from "./dom.js";

let plotter = {
    plot() {
        let rules = {};
        ls.rules.forEach((rule, letter) => rules[letter] = rule);
        let {pathData, minX, minY, width, height} = getSVGData({
            axiom: ls.axiom,
            rules,
            alpha: ls.alpha,
            theta: ls.theta,
            iterations: ls.iterations,
            step: ls.step
        });
        let svg = dom.ui.get("svg");
        svg.setAttribute("viewBox", `${minX - 2} ${minY - 2} ${width + 4} ${height + 4}`);
        svg.setAttribute("width", width.toString());
        svg.setAttribute("height", height.toString());
        svg.getElementsByTagName("path")[0]
            .setAttribute("d", pathData);
    },

    setFGColor(color) {
        dom.ui.get("svg").getElementsByTagName("path")[0]
            .setAttribute("stroke", color);
    },

    setBGColor(color) {
        document.body.style.background = dom.ui.get("svg").style.background = color;
    }
};

export default plotter;
