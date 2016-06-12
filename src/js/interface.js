import dom from "./dom.js";
import "panels/panels.js";
import "panels/settings.js";

let canvas = dom.ui.get("canvas");
let ctx = canvas.getContext("2d");
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);