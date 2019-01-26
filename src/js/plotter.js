import {ls} from "./ls.js";
import {ui} from "./dom.js";

let canvas = ui.get("canvas");
let ctx = canvas.getContext("2d");

let resolutionFactor = window.matchMedia("(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)").matches ? 2 : 1;

/**
 * Internal data for the current plotting process
 * @property {Number} x - Current x-coordinate of the turtle
 * @property {Number} y - Current y-coordinate of the turtle
 * @property {Number} alpha - Current rotation of the turtle
 * @property {Number} left - The leftmost edge x-coordinate of the L-system
 * @property {Number} top - The topmost edge y-coordinate of the L-system
 * @property {Number} right - The rightmost edge x-coordinate of the L-system
 * @property {Number} bottom - The bottommost edge y-coordinate of the L-system
 * @property {Number} step - Cached value of `ls.step`
 * @property {Number} theta - Cached value of `ls.theta`
 * @property {Array.<{x: Number, y: Number, alpha: Number}>} stack - The stack of saved coordinates of the turtle
 * @property {String} cleanCode - Filtered codeword string (all draw irrelevant letters excluded)
 * @type {Object}
 */
let plotData = {stack: []};

/**
 * Maps the codeword letters to the real drawing commands for the turtle
 * @type {Map}
 */
let actions = new Map();

actions.set("F", () => {
    plotData.x += plotData.step * Math.cos(plotData.alpha);
    plotData.y += plotData.step * Math.sin(plotData.alpha);
    ctx.lineTo(plotData.x, plotData.y);
});
actions.set("B", () => {
    plotData.x += plotData.step * Math.cos(plotData.alpha);
    plotData.y += plotData.step * Math.sin(plotData.alpha);
    ctx.moveTo(plotData.x, plotData.y);
});
actions.set("+", () => {
    plotData.alpha += plotData.theta;
});
actions.set("-", () => {
    plotData.alpha -= plotData.theta;
});
actions.set("[", () => {
    plotData.stack.push({x: plotData.x, y: plotData.y, alpha: plotData.alpha});
});
actions.set("]", () => {
    ({x: plotData.x, y: plotData.y, alpha: plotData.alpha} = plotData.stack.pop());
    ctx.moveTo(plotData.x, plotData.y);
});

/**
 * Maps the codeword letters to the commands of the preparatory stage (preparing the plotData object before drawing)
 * @type {Map}
 */
let preactions = new Map([...actions]);

preactions.set("F", () => {
    plotData.x += plotData.step * Math.cos(plotData.alpha);
    plotData.y += plotData.step * Math.sin(plotData.alpha);
    plotData.left = Math.min(plotData.left, plotData.x);
    plotData.right = Math.max(plotData.right, plotData.x);
    plotData.top = Math.min(plotData.top, plotData.y);
    plotData.bottom = Math.max(plotData.bottom, plotData.y);
});
preactions.set("B", preactions.get("F"));
preactions.set("]", () => {
    ({x: plotData.x, y: plotData.y, alpha: plotData.alpha} = plotData.stack.pop());
});


let plotter = {
    settings: {
        fillStyle: "transparent",
        strokeStyle: "#080"
    },

    reset() {
        plotData.cleanCode = "";
        plotData.x = plotData.y = 0;
        ({step: plotData.step, alpha: plotData.alpha, theta: plotData.theta, iterCount: plotData.count} = ls);
        plotData.step *= resolutionFactor;
        plotData.stack.length = 0;
        plotData.left = plotData.top = Number.MAX_VALUE;
        plotData.right = plotData.bottom = -Number.MAX_VALUE;
    },

    /**
     * Calculate L-system bounding rect and cleanup the codeword for the turtle
     * by dropping all letters which don't affect the drawing process
     */
    prepare() {
        let code = ls.getCode();
        let cleanCode = "";
        for (let symbol of code) {
            let action = preactions.get(symbol);
            if (action) {
                cleanCode += symbol;
                action();
            }
        }
        plotData.cleanCode = cleanCode;
    },

    /**
     * Reset the turtle coordinates and empty the stack of saved positions.
     * Call this every time before drawing to guarantee that the L-system will be centered on the canvas
     */
    setup() {
        plotData.x = (canvas.offsetWidth - plotData.left - plotData.right) / 2;
        plotData.y = (canvas.offsetHeight - plotData.top - plotData.bottom) / 2;
        plotData.alpha = ls.alpha;
        plotData.stack.length = 0;
    },

    /**
     * Clear the entire canvas
     */
    clear() {
        ctx.strokeStyle = this.settings.strokeStyle;
        ctx.fillStyle = this.settings.fillStyle;
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    },

    /**
     * Repaint the L-system using the current `plotData` parameters.
     * This doesn't recalculate the entire plot but just redraws the previous result
     */
    repaint() {
        this.clear();
        if (plotData.cleanCode) {
            // We have to reset the turtle coordinates every repaint because of the fact
            // that canvas sizes might change since the last repaint
            this.setup();
            ctx.beginPath();
            ctx.moveTo(plotData.x, plotData.y);
            for (let symbol of plotData.cleanCode) {
                actions.get(symbol)();
            }
            ctx.stroke();
        }
    },

    /**
     * Completely recalculate the entire plot taking the actual parameters of the L-system
     * and then draw the result on the canvas
     */
    plot() {
        this.reset();
        this.prepare();
        this.repaint();
    }
};

export {plotter};
