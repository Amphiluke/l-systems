import resolve from "@rollup/plugin-node-resolve";
import {terser} from "rollup-plugin-terser";

export default {
    input: "src/js/index.js",
    output: {
        file: "dist/js/index.js",
        format: "es"
    },
    plugins: [
        resolve(),
        terser({module: true})
    ]
};