import {terser} from "rollup-plugin-terser";

export default {
    input: "src/js/index.js",
    output: {
        file: "build/js/index.js",
        format: "es"
    },
    plugins: [terser()]
};